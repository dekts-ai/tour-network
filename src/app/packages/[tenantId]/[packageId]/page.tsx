"use client";

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, PackageDetailsResponse } from '@/types/package';
import api from '@/services/api';
import BookingModal from '@/components/BookingModal';

interface PackageDetailsPageProps {
  params: Promise<{
    tenantId: string;
    packageId: string;
  }>;
}

interface PackageWithTenant extends Package {
  tenant_id: string;
}

export default function PackageDetailsPage({ params }: PackageDetailsPageProps) {
  const resolvedParams = use(params);
  const [packageData, setPackageData] = useState<PackageWithTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get<PackageDetailsResponse>(`/package/${resolvedParams.tenantId}/${resolvedParams.packageId}`);
        
        if (response.data.code === 200) {
          const packageWithTenant: PackageWithTenant = {
            ...response.data.data.package,
            tenant_id: response.data.data.tenant_id
          };
          setPackageData(packageWithTenant);
        } else {
          setError('Package not found');
        }
      } catch (err) {
        setError('Error fetching package details');
        console.error('Error fetching package details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackageDetails();
  }, [resolvedParams.tenantId, resolvedParams.packageId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    notFound();
  }

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

  const thingsToBring = parseThingsToBring(packageData.things_to_bring);

  // Generate a dummy image URL based on package ID for consistency
  const getDummyImage = (id: number) => {
    const imageIds = [1011, 1018, 1025, 1035, 1040, 1044, 1051, 1061, 1074, 1080];
    const imageId = imageIds[id % imageIds.length];
    return `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={getDummyImage(packageData.id)}
          alt={packageData.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Header Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <Link 
              href="/packages"
              className="inline-flex items-center text-white hover:text-blue-200 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Packages
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">{packageData.name}</h1>
                <div className="flex items-center gap-6 text-blue-100">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {formatDuration(packageData.hours, packageData.minutes)}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {packageData.tenant_id.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    {packageData.min_pax_allowed} - {packageData.max_pax_allowed || '∞'} people
                  </span>
                </div>
              </div>
              
              {packageData.is_combo_package === 1 && (
                <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-semibold">
                  Combo Package
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Tour</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {packageData.short_description}
              </p>
              {packageData.long_description && (
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: packageData.long_description }} />
                </div>
              )}
            </div>

            {/* What to Bring */}
            {thingsToBring.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Bring</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {thingsToBring.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Notes */}
            {packageData.important_notes && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Information</h2>
                <div className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: packageData.important_notes }} />
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tour Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packageData.package_has_waiver === 1 && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-800 font-medium">Waiver Required</span>
                  </div>
                )}
                
                {packageData.package_has_permit === 1 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">Permit Included</span>
                  </div>
                )}
                
                {packageData.is_group_rate_enabled === 1 && (
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    <span className="text-purple-800 font-medium">Group Rates Available</span>
                  </div>
                )}
                
                {packageData.checkin === 1 && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-orange-800 font-medium">Check-in Required</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Book This Tour</h3>
              
              {/* Tour Details */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{formatDuration(packageData.hours, packageData.minutes)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Group Size</span>
                  <span className="font-semibold">
                    {packageData.min_pax_allowed} - {packageData.max_pax_allowed || '∞'} people
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Operator</span>
                  <span className="font-semibold">{packageData.tenant_id.toUpperCase()}</span>
                </div>
              </div>

              {/* Booking Button */}
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4"
              >
                Book Now
              </button>
              
              <p className="text-sm text-gray-500 text-center">
                Secure booking • Instant confirmation
              </p>

              {/* Contact Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Need Help?</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>Call for availability</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Email support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tenantId={packageData.tenant_id}
        packageId={packageData.id.toString()}
        packageName={packageData.name}
      />
    </div>
  );
}