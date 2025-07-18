"use client";

import React from 'react';
import Link from 'next/link';
import { Package } from '@/types/package';

interface PackageCardProps {
  package: Package & { tenant_id: string };
}

const PackageCard: React.FC<PackageCardProps> = ({ package: pkg }) => {
  const formatDuration = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return 'Flexible';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const parseThingsToBring = (thingsString: string) => {
    try {
      const parsed = JSON.parse(thingsString);
      if (Array.isArray(parsed)) {
        return parsed.map(item => typeof item === 'string' ? item : item.value || '').filter(Boolean);
      }
    } catch {
      // If parsing fails, return empty array
    }
    return [];
  };

  const formatGroupSize = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ people`;
    }
    if (min === max) {
      return `${min} ${min === 1 ? 'person' : 'people'}`;
    }
    return `${min}-${max} people`;
  };

  const thingsToBring = parseThingsToBring(pkg.things_to_bring);

  // Static dummy images - no parameters
  const getDummyImage = (id: number) => {
    const images = [
      'https://images.pexels.com/photos/1011/pexels-photo-1011.jpeg',
      'https://images.pexels.com/photos/1018/pexels-photo-1018.jpeg',
      'https://images.pexels.com/photos/1025/pexels-photo-1025.jpeg',
      'https://images.pexels.com/photos/1035/pexels-photo-1035.jpeg',
      'https://images.pexels.com/photos/1040/pexels-photo-1040.jpeg',
      'https://images.pexels.com/photos/1044/pexels-photo-1044.jpeg',
      'https://images.pexels.com/photos/1051/pexels-photo-1051.jpeg',
      'https://images.pexels.com/photos/1061/pexels-photo-1061.jpeg',
      'https://images.pexels.com/photos/1074/pexels-photo-1074.jpeg',
      'https://images.pexels.com/photos/1080/pexels-photo-1080.jpeg'
    ];
    return images[id % images.length];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getDummyImage(pkg.id)}
          alt={pkg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        {pkg.is_combo_package === 1 && (
          <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">
            Combo
          </span>
        )}
      </div>

      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-100 transition-colors">
              {pkg.name}
            </h3>
            <div className="flex items-center gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {formatDuration(pkg.hours, pkg.minutes)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {pkg.tenant_id.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-3">
          {pkg.short_description}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Group Size: {formatGroupSize(pkg.min_pax_allowed, pkg.max_pax_allowed)}
          </div>
        </div>

        {/* Things to Bring */}
        {thingsToBring.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">What to bring:</h4>
            <div className="flex flex-wrap gap-1">
              {thingsToBring.slice(0, 3).map((item, index) => (
                <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                  {item}
                </span>
              ))}
              {thingsToBring.length > 3 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                  +{thingsToBring.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pkg.package_has_waiver === 1 && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
              Waiver Required
            </span>
          )}
          {pkg.package_has_permit === 1 && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
              Permit Included
            </span>
          )}
          {pkg.is_group_rate_enabled === 1 && (
            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
              Group Rates
            </span>
          )}
        </div>

        {/* Action Button */}
        <Link 
          href={`/packages/${pkg.tenant_id}/${pkg.id}`}
          className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
        >
          View Details & Book
        </Link>
      </div>
    </div>
  );
};

export default PackageCard;