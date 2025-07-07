import Link from 'next/link';
import CartIcon from './CartIcon';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold hover:text-blue-100 transition-colors">
            Tour Network
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-blue-100 transition-colors font-medium">
              Home
            </Link>
            <Link href="/packages" className="hover:text-blue-100 transition-colors font-medium">
              Tour Packages
            </Link>
            <Link href="/about" className="hover:text-blue-100 transition-colors font-medium">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <CartIcon />
          </div>
        </div>
      </div>
    </header>
  );
}