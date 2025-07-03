"use client";

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, PackageDetailsResponse, TimeSlot, TimeSlotsResponse } from '@/types/package';
import api from '@/services/api';

interface SchedulePageProps {
  params: Promise<{
    tenantId: string;
    packageId: string;
  }>;
}

interface PackageWithTenant extends Package {
  tenant_id: string;
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const resolvedParams = use(params);
  const [packageData, setPackageData] = useState<PackageWithTenant | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Initialize with current date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Fetch package details
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

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate && packageData) {
      fetchTimeSlots();
    }
  }, [selectedDate, packageData]);

  const fetchTimeSlots = async () => {
    try {
      setSlotsLoading(true);
      const response = await api.post<TimeSlotsResponse>(`/time-slots/${resolvedParams.tenantId}/${resolvedParams.packageId}`, {
        date: selectedDate
      });
      
      if (response.data.code === 200) {
        setTimeSlots(response.data.data.slots);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTimeSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === currentMonth;
      const isPast = currentDate < today;
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        isCurrentMonth,
        isPast,
        isToday,
        isSelected,
        day: currentDate.getDate()
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return 'Flexible';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
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

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.bookable_status === 'Open') {
      setSelectedSlot(slot);
    }
  };

  const handleBooking = () => {
    if (selectedSlot) {
      // Here you would typically proceed to the next step of booking
      console.log('Booking slot:', selectedSlot);
      alert(`Booking confirmed for ${selectedSlot.time} on ${formatDate(selectedDate)}`);
    }
  };

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

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/"
              className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Home
            </Link>
            <span className="text-white">/</span>
            <Link 
              href="/packages"
              className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
            >
              Packages
            </Link>
            <span className="text-white">/</span>
            <Link 
              href={`/packages/${packageData.tenant_id}/${packageData.id}`}
              className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
            >
              {packageData.name}
            </Link>
            <span className="text-white">/</span>
            <span className="text-blue-200">Schedule</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Schedule Your Tour</h1>
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
                  {formatGroupSize(packageData.min_pax_allowed, packageData.max_pax_allowed)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Calendar Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date</h2>
            
            {/* Calendar Header */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {monthNames[today.getMonth()]} {today.getFullYear()}
                </h3>
              </div>
              
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => !day.isPast && day.isCurrentMonth && setSelectedDate(day.dateStr)}
                    disabled={day.isPast || !day.isCurrentMonth}
                    className={`
                      p-3 text-sm rounded-lg transition-all duration-200 font-medium
                      ${!day.isCurrentMonth 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : day.isPast 
                          ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                          : day.isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-lg'
                            : day.isToday
                              ? 'bg-blue-100 text-blue-600 font-bold hover:bg-blue-200'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }
                    `}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedDate && (
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-sm text-blue-600 font-medium mb-1">Selected Date:</p>
                <p className="text-blue-800 font-bold text-lg">{formatDate(selectedDate)}</p>
              </div>
            )}
          </div>

          {/* Time Slots Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Time Slots</h2>
            
            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading time slots...</span>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No time slots available</p>
                <p className="text-sm">Please select a different date</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={slot.bookable_status === 'Closed'}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                      ${slot.bookable_status === 'Closed'
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : selectedSlot?.id === slot.id
                          ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{slot.time}</p>
                        <p className="text-sm">
                          {slot.bookable_status === 'Open' 
                            ? `${slot.seats} seats available`
                            : 'Fully booked'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        {slot.custom_rate > 0 && (
                          <p className="text-lg font-bold text-green-600">
                            ${slot.custom_rate}
                          </p>
                        )}
                        <span className={`
                          inline-block px-3 py-1 rounded-full text-xs font-medium
                          ${slot.bookable_status === 'Open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }
                        `}>
                          {slot.bookable_status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Summary */}
        {selectedSlot && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Tour Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour:</span>
                    <span className="font-medium">{packageData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedSlot.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(packageData.hours, packageData.minutes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Seats:</span>
                    <span className="font-medium">{selectedSlot.seats}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Pricing</h4>
                <div className="space-y-3">
                  {selectedSlot.custom_rate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per person:</span>
                      <span className="font-medium text-green-600">${selectedSlot.custom_rate}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={handleBooking}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Continue to Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}