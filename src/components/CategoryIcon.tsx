import React from 'react';
import {
  Briefcase,
  Car,
  CreditCard,
  DollarSign,
  Film,
  Gift,
  HeartPulse,
  Laptop,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wifi,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', color }) => {
  const n = (name || '').toLowerCase();

  let IconComponent = MoreHorizontal;

  if (n.includes('food') || n.includes('snack') || n.includes('restaurant') || n.includes('eat') || n.includes('dinner')) {
    IconComponent = Utensils;
  } else if (n.includes('groc') || n.includes('vegetable') || n.includes('fruit')) {
    IconComponent = ShoppingBag;
  } else if (n.includes('transport') || n.includes('metro') || n.includes('rickshaw') || n.includes('bus') || n.includes('auto') || n.includes('fuel') || n.includes('travel')) {
    IconComponent = Car;
  } else if (n.includes('recharge') || n.includes('wifi') || n.includes('internet') || n.includes('mobile')) {
    IconComponent = Wifi;
  } else if (n.includes('shopping') || n.includes('cloth') || n.includes('store')) {
    IconComponent = ShoppingBag;
  } else if (n.includes('bill') || n.includes('electricity') || n.includes('water') || n.includes('rent')) {
    IconComponent = Receipt;
  } else if (n.includes('entertainment') || n.includes('movie') || n.includes('game')) {
    IconComponent = Film;
  } else if (n.includes('health') || n.includes('med') || n.includes('doctor')) {
    IconComponent = HeartPulse;
  } else if (n.includes('gift') || n.includes('family')) {
    IconComponent = Gift;
  } else if (n.includes('salary')) {
    IconComponent = Briefcase;
  } else if (n.includes('freelance') || n.includes('laptop')) {
    IconComponent = Laptop;
  } else if (n.includes('investment') || n.includes('return')) {
    IconComponent = TrendingUp;
  } else if (n.includes('transfer')) {
    IconComponent = CreditCard;
  } else if (n.includes('income')) {
    IconComponent = DollarSign;
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-lg p-2"
      style={{
        backgroundColor: color ? `${color}1A` : '#282D34',
        color: color || '#F5F7FA',
      }}
    >
      <IconComponent className={className} />
    </span>
  );
};
