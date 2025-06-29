import { Link } from 'react-router-dom';
import { 
  ChefHat, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Clock, 
  Shield,
  Smartphone,
  TrendingUp,
  Check,
  Star,
  ArrowRight
} from 'lucide-react';

export const Landing = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: 'Advanced POS System',
      description: 'Streamline your order taking with our intuitive point-of-sale interface designed for speed and efficiency.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get insights into your business with comprehensive reporting and analytics dashboard.'
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Manage your team with role-based access control and performance tracking.'
    },
    {
      icon: Clock,
      title: 'Order Tracking',
      description: 'Track orders from kitchen to customer with real-time status updates.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with automatic backups and data protection.'
    },
    
  ];

  const plans = [
    {
      name: 'Starter',
      price: '₹2499',
      period: '/month',
      description: 'Perfect for small restaurants',
      features: [
        'Up to 2 POS terminals',
        'Basic reporting',
        'Menu management',
        'Order tracking',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: '₹6999',
      period: '/month',
      description: 'For growing restaurants',
      features: [
        'Up to 5 POS terminals',
        'Advanced analytics',
        'Inventory management',
        'Staff management',
        'Kitchen display system',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '₹14999',
      period: '/month',
      description: 'For restaurant chains',
      features: [
        'Unlimited POS terminals',
        'Multi-location support',
        'Custom integrations',
        'Advanced reporting',
        'Dedicated account manager',
        '24/7 phone support'
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GrillBill</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
            
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-orange-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolutionize Your
              <span className="text-primary-500"> Restaurant</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The complete restaurant management solution with advanced POS, inventory tracking, 
              analytics, and staff management. Built for modern restaurants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
                <Link
                to="/register"
                className="border-2 border-primary-500 text-primary-500 px-8 py-4 rounded-lg hover:bg-primary-500 hover:text-white transition-all duration-200 font-semibold text-lg"              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Restaurant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform includes all the tools you need to manage orders, 
              track inventory, analyze performance, and grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="p-6 rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for your restaurant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-primary-500 text-white ring-4 ring-primary-200 scale-105'
                    : 'bg-white border border-gray-200'
                } hover:shadow-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-white text-primary-500 px-3 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-lg ${plan.popular ? 'text-primary-100' : 'text-gray-600'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={plan.popular ? 'text-primary-100' : 'text-gray-600'}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className={`w-5 h-5 mr-3 ${plan.popular ? 'text-primary-200' : 'text-primary-500'}`} />
                      <span className={plan.popular ? 'text-primary-100' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-white text-primary-500 hover:bg-gray-100'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Restaurant Owners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Mukesh Kumar',
                role: 'Owner, Mira\'s Bistro',
                content: 'GrillBill transformed our operations. Order accuracy improved by 40% and our staff loves how easy it is to use.',
                rating: 5
              },
              {
                name: 'Ramesh Shah',
                role: 'Manager, Golden Palm',
                content: 'The inventory management feature alone saved us thousands. We can finally track our costs properly.',
                rating: 5
              },
              {
                name: 'Ayush Garg',
                role: 'Owner, UP 15 Dhaba',
                content: 'Customer service is outstanding. They helped us set up everything and trained our entire team.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of restaurants already using GrillBill to streamline 
            their operations and increase profits.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-500 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold text-lg inline-flex items-center group"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">GrillBill</span>
              </div>
              <p className="text-gray-400">
                The complete restaurant management solution for modern establishments.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Training</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GrillBill. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};