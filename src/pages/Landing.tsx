import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Zap, LayoutList, Shield, Check, Star, Users, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();

  if (user && isPremium) {
    navigate('/dashboard');
    return null;
  }

  const stats = [
    { value: '10K+', label: 'Active Users', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: TrendingUp },
    { value: '24/7', label: 'Support', icon: Shield },
    { value: '50+', label: 'Features', icon: Award },
  ];

  const testimonials = [
    {
      name: 'Alex M.',
      role: 'Power User',
      content: 'The premium features have completely transformed how I work. Zero ads and priority support make it worth every penny!',
      rating: 5,
    },
    {
      name: 'Sarah K.',
      role: 'Content Creator',
      content: 'I tried the 7-day free trial and was blown away. The premium features save me hours every week.',
      rating: 5,
    },
    {
      name: 'Mike R.',
      role: 'Developer',
      content: 'Best investment I\'ve made this year. The lifetime plan was a no-brainer for the value it provides.',
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-[#09090B] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-white"
          >
            Manage your <span className="text-amber-500">PREMIUM</span> Account
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-zinc-400 max-w-2xl"
          >
            Get access to premium features with our flexible plans. Start your 7-day free trial today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to={user ? "/dashboard" : "/pricing"}
              className="px-8 py-4 bg-amber-500 text-black rounded-xl font-bold text-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 transform hover:-translate-y-0.5"
            >
              {user ? "Go to Dashboard" : "Start Free Trial"}
            </Link>
            {!user && (
              <Link 
                to="/login"
                className="px-8 py-4 bg-zinc-900 border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-zinc-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#0C0C0E] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-zinc-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Premium Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-start p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Premium Features</h3>
              <p className="text-zinc-400">Unlock powerful features designed to enhance your experience.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-start p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6">
                <LayoutList className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Zero Ads</h3>
              <p className="text-zinc-400">Enjoy an uninterrupted experience without distractions.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col items-start p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Priority Support</h3>
              <p className="text-zinc-400">Get fast, dedicated support when you need it most.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#0C0C0E] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-zinc-500 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview */}
      <section className="py-24 bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Monthly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-zinc-900/50 border border-white/10 rounded-2xl flex flex-col"
            >
              <h3 className="text-xl font-bold text-white mb-2">Monthly</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$9.99</span>
                <span className="text-zinc-400">/month</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">7-day free trial included</p>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Premium Features</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Zero Ads</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <button 
                onClick={() => navigate(user ? "/pricing" : "/login")}
                className="mt-6 w-full px-4 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Get Started
              </button>
            </motion.div>

            {/* Yearly - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="p-8 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl flex flex-col relative"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full text-xs font-bold">
                <Star className="w-3 h-3" />
                <span>Most Popular</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Yearly</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">$79.99</span>
                <span className="text-zinc-400">/year</span>
              </div>
              <p className="text-sm text-amber-500 font-semibold mb-6">Save 33% vs monthly</p>
              <p className="text-sm text-zinc-400 mb-6">7-day free trial included</p>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Everything in Monthly</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>2 months free</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Annual savings</span>
                </li>
              </ul>
              <button 
                onClick={() => navigate(user ? "/pricing" : "/login")}
                className="mt-6 w-full px-4 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Get Started
              </button>
            </motion.div>

            {/* Lifetime */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="p-8 bg-zinc-900/50 border border-white/10 rounded-2xl flex flex-col"
            >
              <h3 className="text-xl font-bold text-white mb-2">Lifetime</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$199.99</span>
                <span className="text-zinc-400">once</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">One-time payment, forever access</p>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Everything Forever</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>No recurring charges</span>
                </li>
                <li className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-amber-500" />
                  <span>Immediate access</span>
                </li>
              </ul>
              <button 
                onClick={() => navigate(user ? "/pricing" : "/login")}
                className="mt-6 w-full px-4 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0C0C0E] border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to upgrade?</h2>
          <p className="text-xl text-zinc-400 mb-8">Start your free 7-day trial. No credit card required for the trial period.</p>
          <Link
            to={user ? "/pricing" : "/login"}
            className="inline-block px-8 py-4 bg-amber-500 text-black rounded-xl font-bold text-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            {user ? "View Plans" : "Get Started Now"}
          </Link>
        </div>
      </section>
    </div>
  );
}
