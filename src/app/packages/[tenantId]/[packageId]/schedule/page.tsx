"use client";

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, PackageDetailsResponse, TimeSlot, TimeSlotsResponse, RateGroup, RateGroupsResponse, RateGroupSelection, CustomFormResponse, CustomForm, FormField, AddOnSelection, PromoCode, PromoCodeResponse, PromoCodeRequest } from '@/types/package';
import { FormFieldManager } from '@/utils/formUtils';
import AddOnField from '@/components/AddOnField';
import PromoCodeSection from '@/components/PromoCodeSection';
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
  const [rateGroups, setRateGroups] = useState<RateGroup[]>([]);
  const [rateGroupSelections, setRateGroupSelections] = useState<RateGroupSelection[]>([]);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [addOnSelections, setAddOnSelections] = useState<{ [key: string]: any }>({});
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rateGroupsLoading, setRateGroupsLoading] = useState(false);
  const [customFormLoading, setCustomFormLoading] = useState(false);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [hasCustomRatesInSlots, setHasCustomRatesInSlots] = useState(false);
  const [rateGroupCommission, setRateGroupCommission] = useState<number | null>(null);

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

  // Fetch custom form
  useEffect(() => {
    const fetchCustomForm = async () => {
      try {
        setCustomFormLoading(true);
        const response = await api.get<CustomFormResponse>(`/custom-form/${resolvedParams.tenantId}/${resolvedParams.packageId}`);
        
        if (response.data.code === 200) {
          setCustomForm(response.data.data.custom_form);
          
          // Initialize add-on selections with default values
          const visibleFields = FormFieldManager.getVisibleFields(response.data.data.custom_form.form_fields);
          const initialSelections: { [key: string]: any } = {};
          
          visibleFields.forEach(field => {
            initialSelections[field.id] = FormFieldManager.getDefaultValue(field);
          });
          
          setAddOnSelections(initialSelections);
        }
      } catch (err) {
        console.error('Error fetching custom form:', err);
        // Don't set error state as custom form might not exist for all packages
      } finally {
        setCustomFormLoading(false);
      }
    };

    if (packageData) {
      fetchCustomForm();
    }
  }, [packageData, resolvedParams.tenantId, resolvedParams.packageId]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate && packageData) {
      fetchTimeSlots();
      // Reset promo code when date changes
      setAppliedPromoCode(null);
      setPromoCodeError(null);
    }
  }, [selectedDate, packageData]);

  // Fetch rate groups based on custom rates logic
  useEffect(() => {
    if (selectedDate && packageData && timeSlots.length > 0) {
      // Check if any slot has custom_rate > 0
      const hasCustomRates = timeSlots.some(slot => slot.custom_rate > 0);
      setHasCustomRatesInSlots(hasCustomRates);
      
      // If no custom rates in any slot, fetch rate groups immediately
      if (!hasCustomRates) {
        fetchRateGroups(false); // false = date-based, not slot-based
      } else {
        // Clear rate groups when custom rates are present but no slot selected
        if (!selectedSlot) {
          setRateGroups([]);
          setRateGroupSelections([]);
        }
      }
    }
  }, [timeSlots, selectedDate, packageData]);

  // Fetch rate groups when slot is selected (only if custom rates exist)
  useEffect(() => {
    if (selectedSlot && hasCustomRatesInSlots && packageData) {
      fetchRateGroups(true, selectedSlot); // true = slot-based
    }
  }, [selectedSlot, hasCustomRatesInSlots, packageData]);

  const fetchTimeSlots = async () => {
    try {
      setSlotsLoading(true);
      const response = await api.post<TimeSlotsResponse>(`/time-slots/${resolvedParams.tenantId}/${resolvedParams.packageId}`, {
        date: selectedDate
      });
      
      if (response.data.code === 200) {
        setTimeSlots(response.data.data.slots);
        // Reset selected slot when date changes
        setSelectedSlot(null);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTimeSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchRateGroups = async (isSlotBased: boolean = false, slot?: TimeSlot) => {
    try {
      setRateGroupsLoading(true);
      
      const requestData: any = {
        date: selectedDate
      };
      
      // Add slot_id only if it's slot-based and slot has custom_rate > 0
      if (isSlotBased && slot && slot.custom_rate > 0) {
        requestData.slot_id = slot.id;
      }
      
      const response = await api.post<RateGroupsResponse>(`/rate-groups/${resolvedParams.tenantId}/${resolvedParams.packageId}`, requestData);
      
      if (response.data.code === 200) {
        setRateGroups(response.data.data.rate_groups);
        setRateGroupCommission(response.data.data.service_commission_percentage);
        // Initialize rate group selections with 0 quantity
        const initialSelections = response.data.data.rate_groups.map(rateGroup => ({
          rateGroup,
          quantity: 0,
          subtotal: 0,
          commission: 0,
          total: 0
        }));
        setRateGroupSelections(initialSelections);
      }
    } catch (error) {
      console.error('Error fetching rate groups:', error);
      setRateGroups([]);
      setRateGroupSelections([]);
    } finally {
      setRateGroupsLoading(false);
    }
  };

  const applyPromoCode = async (code: string) => {
    try {
      setPromoCodeLoading(true);
      setPromoCodeError(null);
      
      const requestData: PromoCodeRequest = {
        coupon: code,
        date: selectedDate
      };
      
      const response = await api.post<PromoCodeResponse>(`/set-coupon/${resolvedParams.tenantId}/${resolvedParams.packageId}`, requestData);
      
      if (response.data.code === 200) {
        setAppliedPromoCode(response.data.data.coupon);
        setPromoCodeError(null);
      }
    } catch (error: any) {
      console.error('Error applying promo code:', error);
      
      // Handle specific error codes
      if (error.response?.status === 410) {
        setPromoCodeError('Your coupon code is no longer valid.');
      } else if (error.response?.status === 404) {
        setPromoCodeError('Your coupon code is not valid.');
      } else {
        setPromoCodeError('Failed to apply promo code. Please try again.');
      }
      
      setAppliedPromoCode(null);
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoCodeError(null);
  };

  const calculatePricing = (rateGroup: RateGroup, quantity: number, serviceCommissionPercentage: number) => {
    if (quantity === 0) {
      return { subtotal: 0, commission: 0, total: 0 };
    }

    const rate = parseFloat(rateGroup.rate);
    const permitFee = parseFloat(rateGroup.permit_fee);
    const additionalCharge = parseFloat(rateGroup.additional_charge);
    const partnerFeeAmount = parseFloat(rateGroup.partner_fee_amount);
    
    // Calculate subtotal per person
    const subtotalPerPerson = rate + permitFee + additionalCharge + partnerFeeAmount;
    
    // Calculate commission per person based on subtotal
    const commissionPerPerson = roundout((subtotalPerPerson * serviceCommissionPercentage) / 100);
    
    // Calculate totals
    const subtotal = subtotalPerPerson * quantity;
    const commission = commissionPerPerson * quantity;
    const total = subtotal + commission;
    
    return { subtotal, commission, total };
  };

  const updateRateGroupQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 0 || !packageData) return;
    
    // Get current total guests excluding this rate group
    const currentTotalExcludingThis = rateGroupSelections.reduce((total, selection, i) => {
      return i === index ? total : total + selection.quantity;
    }, 0);
    
    // Check if adding this quantity would exceed available seats
    const availableSeats = getAvailableSeats();
    if (currentTotalExcludingThis + newQuantity > availableSeats) {
      return; // Don't allow the update
    }
    
    const updatedSelections = [...rateGroupSelections];
    const rateGroup = updatedSelections[index].rateGroup;
    const serviceCommissionPercentage = rateGroupCommission ?? parseFloat(packageData.service_commission_percentage);
    
    const pricing = calculatePricing(rateGroup, newQuantity, serviceCommissionPercentage);
    
    updatedSelections[index] = {
      rateGroup,
      quantity: newQuantity,
      ...pricing
    };
    
    setRateGroupSelections(updatedSelections);
  };

  const updateAddOnSelection = (fieldId: string, value: any) => {
    setAddOnSelections(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const getTotalGuests = () => {
    return rateGroupSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const getTourSubtotal = () => {
    return rateGroupSelections.reduce((total, selection) => total + selection.total, 0);
  };

  const getPromoDiscount = () => {
    if (!appliedPromoCode) return 0;
    
    const tourSubtotal = getTourSubtotal();
    const discountValue = parseFloat(appliedPromoCode.discount_value);
    
    if (appliedPromoCode.discount_value_type === 'Percent') {
      return (tourSubtotal * discountValue) / 100;
    } else {
      // Fixed Money - don't exceed tour subtotal
      return Math.min(discountValue, tourSubtotal);
    }
  };

  const getTotalAmount = () => {
    const tourSubtotal = getTourSubtotal();
    const promoDiscount = getPromoDiscount();
    const addOnTotal = getAddOnTotal();
    
    return tourSubtotal - promoDiscount + addOnTotal;
  };

  const getAddOnTotal = () => {
    if (!customForm || !packageData) return 0;
    
    const visibleFields = FormFieldManager.getVisibleFields(customForm.form_fields);
    const serviceCommissionPercentage = rateGroupCommission ?? parseFloat(packageData.service_commission_percentage);
    const totalGuests = getTotalGuests();
    
    return visibleFields.reduce((total, field) => {
      const value = addOnSelections[field.id];
      if (!value) return total;
      
      // For radio fields, check if value should be priced (not "0")
      if (field.type === 'radio' && !FormFieldManager.shouldPriceRadioValue(value)) {
        return total;
      }
      
      const pricing = FormFieldManager.calculateAddOnPricing(
        field,
        value,
        1,
        totalGuests,
        serviceCommissionPercentage
      );
      
      return total + pricing.total;
    }, 0);
  };

  const getAddOnSubtotal = () => {
    if (!customForm || !packageData) return 0;
    
    const visibleFields = FormFieldManager.getVisibleFields(customForm.form_fields);
    const serviceCommissionPercentage = rateGroupCommission ?? parseFloat(packageData.service_commission_percentage);
    const totalGuests = getTotalGuests();
    
    return visibleFields.reduce((total, field) => {
      const value = addOnSelections[field.id];
      if (!value) return total;
      
      // For radio fields, check if value should be priced (not "0")
      if (field.type === 'radio' && !FormFieldManager.shouldPriceRadioValue(value)) {
        return total;
      }
      
      const pricing = FormFieldManager.calculateAddOnPricing(
        field,
        value,
        1,
        totalGuests,
        serviceCommissionPercentage
      );
      
      return total + pricing.subtotal;
    }, 0);
  };

  const getAddOnCommission = () => {
    if (!customForm || !packageData) return 0;
    
    const visibleFields = FormFieldManager.getVisibleFields(customForm.form_fields);
    const serviceCommissionPercentage = rateGroupCommission ?? parseFloat(packageData.service_commission_percentage);
    const totalGuests = getTotalGuests();
    
    return visibleFields.reduce((total, field) => {
      const value = addOnSelections[field.id];
      if (!value) return total;
      
      // For radio fields, check if value should be priced (not "0")
      if (field.type === 'radio' && !FormFieldManager.shouldPriceRadioValue(value)) {
        return total;
      }
      
      const pricing = FormFieldManager.calculateAddOnPricing(
        field,
        value,
        1,
        totalGuests,
        serviceCommissionPercentage
      );
      
      return total + pricing.commission;
    }, 0);
  };

  const roundout = (amount: number, places: number = 2) => {
    if (places < 0) places = 0;
    const x = Math.pow(10, places);
    const formul = (amount * x).toFixed(10);
    return (amount >= 0 ? Math.ceil(parseFloat(formul)) : Math.floor(parseFloat(formul))) / x;
  };

  const getAvailableSeats = () => {
    if (hasCustomRatesInSlots && selectedSlot) {
      return selectedSlot.seats;
    } else if (!hasCustomRatesInSlots && timeSlots.length > 0) {
      // For date-based booking, use the maximum available seats from all open slots
      const openSlots = timeSlots.filter(slot => slot.bookable_status === 'Open');
      return openSlots.length > 0 ? Math.max(...openSlots.map(slot => slot.seats)) : 0;
    }
    return 0;
  };

  const getRemainingSeats = () => {
    return getAvailableSeats() - getTotalGuests();
  };

  const canIncreaseQuantity = (currentQuantity: number) => {
    const totalOtherGuests = getTotalGuests() - currentQuantity;
    return totalOtherGuests + currentQuantity + 1 <= getAvailableSeats();
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
      // Reset rate group selections when changing slots to avoid exceeding new slot capacity
      if (rateGroupSelections.length > 0) {
        const resetSelections = rateGroupSelections.map(selection => ({
          ...selection,
          quantity: 0,
          subtotal: 0,
          commission: 0,
          total: 0
        }));
        setRateGroupSelections(resetSelections);
      }
    }
  };

  const handleBooking = () => {
    const totalGuests = getTotalGuests();
    if (selectedSlot && totalGuests > 0) {
      console.log('Booking details:', {
        slot: selectedSlot,
        date: selectedDate,
        rateGroupSelections: rateGroupSelections.filter(s => s.quantity > 0),
        addOnSelections,
        appliedPromoCode,
        promoDiscount: getPromoDiscount(),
        totalGuests,
        totalAmount: getTotalAmount()
      });
      alert(`Booking confirmed for ${selectedSlot.time} on ${formatDate(selectedDate)} for ${totalGuests} guests`);
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
  const visibleAddOnFields = customForm ? FormFieldManager.getVisibleFields(customForm.form_fields) : [];

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
                            Custom Rate
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

        {/* Rate Groups Section */}
        {((selectedSlot && hasCustomRatesInSlots) || (!hasCustomRatesInSlots && timeSlots.length > 0)) && rateGroups.length > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Select Guests</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Seats</p>
                <p className="text-2xl font-bold text-green-600">{getAvailableSeats()}</p>
                {getTotalGuests() > 0 && (
                  <p className="text-sm text-orange-600">
                    {getRemainingSeats()} remaining
                  </p>
                )}
              </div>
            </div>
            
            {rateGroupsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading pricing options...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {rateGroupSelections.map((selection, index) => (
                  <div key={selection.rateGroup.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{selection.rateGroup.rate_for}</h4>
                        <p className="text-sm text-gray-600">
                          ${parseFloat(selection.rateGroup.rate).toFixed(2)} per person
                          {parseFloat(selection.rateGroup.permit_fee) > 0 && (
                            <span> + ${parseFloat(selection.rateGroup.permit_fee).toFixed(2)} permit fee</span>
                          )}
                          {parseFloat(selection.rateGroup.additional_charge) > 0 && (
                            <span> + ${parseFloat(selection.rateGroup.additional_charge).toFixed(2)} additional charge</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateRateGroupQuantity(index, selection.quantity - 1)}
                            disabled={selection.quantity === 0}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <div className="px-4 py-2 text-center min-w-[60px] border-l border-r border-gray-300">
                            <span className="font-semibold text-lg">{selection.quantity}</span>
                          </div>
                          
                          <button
                            onClick={() => updateRateGroupQuantity(index, selection.quantity + 1)}
                            disabled={!canIncreaseQuantity(selection.quantity)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={!canIncreaseQuantity(selection.quantity) ? 'No more seats available' : 'Add guest'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        {selection.quantity > 0 && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ${selection.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${selection.subtotal.toFixed(2)} + ${selection.commission.toFixed(2)} fees
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selection.rateGroup.description && (
                      <p className="text-sm text-gray-600 mt-2">{selection.rateGroup.description}</p>
                    )}
                  </div>
                ))}
                
                {/* Seat Limit Warning */}
                {getTotalGuests() >= getAvailableSeats() && getAvailableSeats() > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-orange-800 font-medium">
                        Maximum capacity reached! You've selected all {getAvailableSeats()} available seats.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Promo Code Section */}
        {getTotalGuests() > 0 && getTourSubtotal() > 0 && (
          <div className="mt-12">
            <PromoCodeSection
              onApplyPromoCode={applyPromoCode}
              appliedPromoCode={appliedPromoCode}
              promoCodeLoading={promoCodeLoading}
              promoCodeError={promoCodeError}
              onRemovePromoCode={removePromoCode}
              tourSubtotal={getTourSubtotal()}
            />
          </div>
        )}

        {/* Add-ons Section */}
        {visibleAddOnFields.length > 0 && getTotalGuests() > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tour Add-ons</h3>
            
            {customFormLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading add-ons...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {visibleAddOnFields.map((field) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-6">
                    <AddOnField
                      field={field}
                      value={addOnSelections[field.id]}
                      onChange={(value) => updateAddOnSelection(field.id, value)}
                      totalGuests={getTotalGuests()}
                      serviceCommissionPercentage={rateGroupCommission ?? parseFloat(packageData.service_commission_percentage)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Summary */}
        {((selectedSlot && hasCustomRatesInSlots) || (!hasCustomRatesInSlots && timeSlots.length > 0)) && getTotalGuests() > 0 && (
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
                  {selectedSlot && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{selectedSlot.time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(packageData.hours, packageData.minutes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Guests:</span>
                    <span className="font-medium">{getTotalGuests()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Pricing Breakdown</h4>
                <div className="space-y-3">
                  {/* Rate Groups */}
                  {rateGroupSelections
                    .filter(selection => selection.quantity > 0)
                    .map((selection, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {selection.quantity}x {selection.rateGroup.rate_for}
                        </span>
                        <span className="font-medium">${selection.total.toFixed(2)}</span>
                      </div>
                    ))}
                  
                  {/* Tour Subtotal */}
                  <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                    <span className="text-gray-700">Tour Subtotal:</span>
                    <span>${getTourSubtotal().toFixed(2)}</span>
                  </div>
                  
                  {/* Promo Discount */}
                  {appliedPromoCode && getPromoDiscount() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        Promo Discount ({appliedPromoCode.discount_value_type === 'Percent' 
                          ? `${appliedPromoCode.discount_value}%` 
                          : `$${appliedPromoCode.discount_value}`}):
                      </span>
                      <span className="text-green-600 font-medium">-${getPromoDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Add-ons */}
                  {visibleAddOnFields
                    .filter(field => {
                      const value = addOnSelections[field.id];
                      if (!value || !FormFieldManager.hasPricing(field)) return false;
                      
                      // For radio fields, check if value should be priced (not "0")
                      if (field.type === 'radio') {
                        return FormFieldManager.shouldPriceRadioValue(value);
                      }
                      
                      return true;
                    })
                    .map((field) => {
                      const value = addOnSelections[field.id];
                      const pricing = FormFieldManager.calculateAddOnPricing(
                        field,
                        value,
                        1,
                        getTotalGuests(),
                        rateGroupCommission ?? parseFloat(packageData.service_commission_percentage)
                      );
                      
                      return (
                        <div key={field.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {field.name}
                          </span>
                          <span className="font-medium">${pricing.total.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  
                  {/* Add-ons Subtotal */}
                  {getAddOnTotal() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Add-ons Subtotal:</span>
                      <span className="font-medium">${getAddOnTotal().toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">${getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3">
                    <button
                      onClick={handleBooking}
                      disabled={!selectedSlot && hasCustomRatesInSlots}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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