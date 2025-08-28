'use client';

import React from 'react';
import Layout from '@/components/Layout';
import PricingCards from '@/components/PricingCards';

export default function PricingPage() {
  return (
    <Layout currentView="pricing">
      <PricingCards />
    </Layout>
  );
}