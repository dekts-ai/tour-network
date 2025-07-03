"use client";

import React, { useState, useEffect } from 'react';
import { TimeSlot } from '@/types/package';
import api from '@/services/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  packageId: string;
  packageName: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  packageId,
  packageName
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Initialize with current date
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [isOpen]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate && isOpen) {
      fetchTimeSlots();
    }
  }, [selectedDate, isOpen]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/time-slots/${tenantId}/${packageId}`, {
        date: selectedDate
      });
      
      if (response.data.code === 200) {
        setTimeSlots(response.data.data.slots);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
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
      onClose();
    }
  };

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const today = new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Book Your Tour</h2>
              <p className="text-blue-100 mt-1">{packageName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
              
              {/* Calendar Header */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {monthNames[today.getMonth()]} {today.getFullYear()}
                  </h4>
                </div>
                
                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 mt-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => !day.isPast && day.isCurrentMonth && setSelectedDate(day.dateStr)}
                      disabled={day.isPast || !day.isCurrentMonth}
                      className={`
                        p-2 text-sm rounded-lg transition-all duration-200
                        ${!day.isCurrentMonth 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : day.isPast 
                            ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                            : day.isSelected
                              ? 'bg-blue-600 text-white font-semibold'
                              : day.isToday
                                ? 'bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200'
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
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Selected Date:</p>
                  <p className="text-blue-800 font-semibold">{formatDate(selectedDate)}</p>
                </div>
              )}
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading time slots...</span>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No time slots available for this date</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
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
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{slot.time}</p>
                          <p className="text-sm">
                            {slot.bookable_status === 'Open' 
                              ? `${slot.seats} seats available`
                              : 'Fully booked'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          {slot.custom_rate > 0 && (
                            <p className="text-sm font-medium text-green-600">
                              ${slot.custom_rate}
                            </p>
                          )}
                          <span className={`
                            inline-block px-2 py-1 rounded-full text-xs font-medium
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

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                {selectedSlot && (
                  <div className="text-sm text-gray-600">
                    <p>Selected: <span className="font-semibold">{selectedSlot.time}</span> on {formatDate(selectedDate)}</p>
                    <p>Available seats: <span className="font-semibold">{selectedSlot.seats}</span></p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot}
                  className={`
                    px-6 py-2 rounded-lg font-semibold transition-all duration-300
                    ${selectedSlot
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  Continue Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;