'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

const data = [
  { name: 'Transfers', value: 120000, color: '#EB6028' }, // Ember
  { name: 'Bills & Utilities', value: 45000, color: '#4285F4' }, // Blue
  { name: 'Airtime & Data', value: 15000, color: '#34A853' }, // Green
]

export default function AnalyticsPage() {
  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8 gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-cream mb-2">Analytics</h1>
          <p className="text-cream/60">Your spending breakdown for this month.</p>
        </div>
        <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-cream outline-none cursor-pointer hover:bg-white/10 transition-colors">
          <option className="bg-brown">This Month</option>
          <option className="bg-brown">Last Month</option>
          <option className="bg-brown">Last 3 Months</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="p-8 h-full flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="font-heading font-semibold text-cream self-start mb-6 w-full text-lg">Spending Distribution</h3>
            
            <div className="w-full h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#320A03', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#FCECDC' }}
                    itemStyle={{ color: '#FCECDC' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Total overlay inside the donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-cream/50 text-sm font-medium">Total Spent</span>
                <span className="text-2xl font-bold text-cream">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Breakdown Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <Card className="p-8 h-full">
            <h3 className="font-heading font-semibold text-cream mb-8 text-lg">Category Breakdown</h3>
            
            <div className="space-y-6">
              {data.map((item) => {
                const percentage = Math.round((item.value / total) * 100)
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-cream font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-cream block">₦{item.value.toLocaleString()}</span>
                        <span className="text-xs text-cream/50">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full" 
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
