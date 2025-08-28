import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { InputValidator } from '@/lib/input-validator'
import { applyRateLimit } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, '/api/auth/register');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // SECURITY: Parse and validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // SECURITY: Comprehensive input validation
    const emailValidation = InputValidator.validateEmail(body.email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    const passwordValidation = InputValidator.validatePassword(body.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    const nameValidation = body.name 
      ? InputValidator.validateText(body.name, 100)
      : { isValid: true, sanitized: emailValidation.sanitized!.split('@')[0] };

    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    try {
      // SECURITY: Dynamic import to prevent client-side bundling
      console.log('🔍 [REGISTER] Attempting to import database module');
      const databaseModule = await import('@/lib/database');
      const database = databaseModule.default;
      
      console.log('🔍 [REGISTER] Database module imported successfully');

      // SECURITY: Check if user already exists
      const existingUserResult = await database.query(
        'SELECT id FROM users WHERE email = $1',
        [emailValidation.sanitized]
      );

      if (existingUserResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 409 }
        );
      }

      // SECURITY: Hash password with higher cost factor
      const hashedPassword = await bcrypt.hash(passwordValidation.sanitized!, 12);

      // SECURITY: Use parameterized query
      const result = await database.query(
        'INSERT INTO users (email, password, name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name, role, created_at',
        [emailValidation.sanitized, hashedPassword, nameValidation.sanitized, 'user']
      );

      const newUser = result.rows[0];

      // SECURITY: Don't log sensitive information
      console.log('✅ [REGISTER] User created successfully:', { 
        id: newUser.id, 
        email: newUser.email.substring(0, 3) + '***'
      });

      // SECURITY: Remove sensitive data from response
      const response = NextResponse.json(
        { 
          message: 'アカウントが作成されました',
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          }
        },
        { status: 201 }
      );

      // SECURITY: Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      
      return response;
      
    } catch (dbError) {
      console.error('❌ [REGISTER] Database error:', dbError instanceof Error ? dbError.message : 'Unknown error');
      
      // SECURITY: Generic error message to prevent information disclosure
      return NextResponse.json(
        { error: 'アカウント作成に失敗しました。しばらく後で再試行してください。' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [REGISTER] Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}