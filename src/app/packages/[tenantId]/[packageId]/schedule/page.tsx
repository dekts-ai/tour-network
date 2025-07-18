"use client";

import React, { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, PackageDetailsResponse, TimeSlot, TimeSlotsResponse, RateGroup, RateGroupsResponse, RateGroupSelection, CustomFormResponse, CustomForm, FormField, AddOnSelection, PromoCode, PromoCodeResponse, PromoCodeRequest } from '@/types/package';
import { CartItem } from '@/types/cart';
import { FormFieldManager } from '@/utils/formUtils';
import { TimezoneManager } from '@/utils/timezoneUtils';
import AddOnField from '@/components/AddOnField';
import PromoCodeSection from '@/components/PromoCodeSection';
import BookingActions from '@/components/BookingActions';
import api from '@/services/api';
import { NumberManager } from '@/utils/numberUtils';

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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<TimeSlot[]>([]);
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
  const [addOnFieldDetails, setAddOnFieldDetails] = useState<any[]>([]);

  // Group rate specific state
  const [selectedGroupSize, setSelectedGroupSize] = useState<number>(0);
  const [groupRateOptions, setGroupRateOptions] = useState<RateGroup[]>([]);

  // Get the timezone for this package
  const packageTimezone = TimezoneManager.getPackageTimezone(packageData?.timezone);

  // Initialize with current date in package timezone
  useEffect(() => {
    if (packageData) {
      const todayStr = TimezoneManager.getTodayString(packageTimezone);
      setSelectedDate(todayStr);
      setCurrentMonth(TimezoneManager.getCurrentMonth(packageTimezone));
    }
  }, [packageData, packageTimezone]);

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

        if (response.data.code === 200 && response.data.data?.custom_form) {
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

  // Filter time slots based on timezone and current time
  useEffect(() => {
    if (timeSlots.length > 0 && selectedDate && packageData) {
      const filtered = TimezoneManager.filterFutureSlots(timeSlots, selectedDate, packageTimezone);
      setFilteredTimeSlots(filtered);
    } else {
      setFilteredTimeSlots([]);
    }
  }, [timeSlots, selectedDate, packageData, packageTimezone]);

  // Fetch rate groups based on custom rates logic
  useEffect(() => {
    if (selectedDate && packageData && filteredTimeSlots.length > 0) {
      // Check if any slot has custom_rate > 0
      const hasCustomRates = filteredTimeSlots.some(slot => slot.custom_rate > 0);
      setHasCustomRatesInSlots(hasCustomRates);

      // If no custom rates in any slot, fetch rate groups immediately
      if (!hasCustomRates) {
        fetchRateGroups(false); // false = date-based, not slot-based
      } else {
        // Clear rate groups when custom rates are present but no slot selected
        if (!selectedSlot) {
          setRateGroups([]);
          setRateGroupSelections([]);
          setGroupRateOptions([]);
        }
      }
    }
  }, [filteredTimeSlots, selectedDate, packageData]);

  // Fetch rate groups when slot is selected (only if custom rates exist)
  useEffect(() => {
    if (selectedSlot && hasCustomRatesInSlots && packageData) {
      fetchRateGroups(true, selectedSlot); // true = slot-based
    }
  }, [selectedSlot, hasCustomRatesInSlots, packageData]);

  const fetchTimeSlots = async () => {
    try {
      setSlotsLoading(true);
      console.log('Fetching time slots for date:', selectedDate); // Debug log

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

        // Check if this is a group rate package
        if (packageData && packageData.is_group_rate_enabled === 1) {
          // For group rate packages, store all rate groups as options
          setGroupRateOptions(response.data.data.rate_groups);
          setSelectedGroupSize(0);
          setRateGroupSelections([]);
        } else {
          // Initialize rate group selections with 0 quantity for regular packages
          const initialSelections = response.data.data.rate_groups.map(rateGroup => ({
            rateGroup,
            quantity: 0,
            subtotal: 0,
            commission: 0,
            total: 0
          }));
          setRateGroupSelections(initialSelections);
        }
      }
    } catch (error) {
      console.error('Error fetching rate groups:', error);
      setRateGroups([]);
      setRateGroupSelections([]);
      setGroupRateOptions([]);
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
    const permitFee = parseFloat(rateGroup.permit_fee || '0');
    const additionalCharge = parseFloat(rateGroup.additional_charge || '0');
    const partnerFeeAmount = parseFloat(rateGroup.partner_fee_amount || '0');

    // Calculate subtotal per person
    const subtotalPerPerson = rate + permitFee + additionalCharge + partnerFeeAmount;

    // Calculate commission per person based on subtotal
    const commissionPerPerson = NumberManager.roundout((subtotalPerPerson * serviceCommissionPercentage) / 100);

    // Calculate totals
    const subtotal = subtotalPerPerson * quantity;
    const commission = commissionPerPerson * quantity;
    const total = subtotal + commission;

    return { subtotal, commission, total };
  };

  const calculateGroupRatePricing = (rateGroup: RateGroup, serviceCommissionPercentage: number) => {
    const rate = parseFloat(rateGroup.rate);
    const tax = parseFloat(rateGroup.tax || '0');
    const permitFee = parseFloat(rateGroup.permit_fee || '0');
    const additionalCharge = parseFloat(rateGroup.additional_charge || '0');
    const partnerFeeAmount = parseFloat(rateGroup.partner_fee_amount || '0');

    // Calculate subtotal for the group
    const subtotal = rate + tax + permitFee + additionalCharge + partnerFeeAmount;

    // Calculate commission based on subtotal
    const commission = NumberManager.roundout((subtotal * serviceCommissionPercentage) / 100);

    // Calculate total
    const total = subtotal + commission;

    return { subtotal, commission, total };
  };

  const handleGroupSizeChange = (size: number) => {
    if (!packageData || size < 0) return;

    // Check if new size would exceed available seats
    const availableSeats = getAvailableSeats();
    if (size > availableSeats) {
      return; // Don't allow the update
    }

    setSelectedGroupSize(size);

    if (size === 0) {
      setRateGroupSelections([]);
      return;
    }

    // Find the appropriate rate group for this size
    const applicableRateGroup = groupRateOptions.find(rateGroup => {
      const groupSize = rateGroup.size || 1;
      return groupSize === size;
    });

    if (applicableRateGroup) {
      const serviceCommissionPercentage = rateGroupCommission ?? parseFloat(packageData.service_commission_percentage);
      const pricing = calculateGroupRatePricing(applicableRateGroup, serviceCommissionPercentage);

      setRateGroupSelections([{
        rateGroup: applicableRateGroup,
        quantity: 1, // Always 1 for group rates (represents one group)
        ...pricing
      }]);
    } else {
      setRateGroupSelections([]);
    }
  };

  const updateRateGroupQuantity = (index: number, newQuantity: number) => {
    // Skip for group rate packages
    if (packageData?.is_group_rate_enabled === 1) return;

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

  const handleAddOnChange = (fieldId: string, value: any) => {
    setAddOnSelections(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFieldDetailsChange = React.useCallback((fieldDetails: any) => {
    setAddOnFieldDetails(prev => {
      const existing = prev.findIndex(detail => detail.id === fieldDetails.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = fieldDetails;
        return updated;
      } else {
        return [...prev, fieldDetails];
      }
    });
  }, []);

  const getTotalGuests = () => {
    if (packageData?.is_group_rate_enabled === 1) {
      return selectedGroupSize;
    }
    return rateGroupSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const getTourSubtotal = () => {
    return NumberManager.roundout(rateGroupSelections.reduce((total, selection) => total + selection.subtotal, 0));
  };

  const getTourCommission = () => {
    if (!packageData) return 0;
    const serviceCommissionPercentage = rateGroupCommission ?? parseFloat(packageData.service_commission_percentage);
    let commission = 0;    
    if (appliedPromoCode?.id) {
      commission = (getTourSubtotal() - getPromoDiscount()) * serviceCommissionPercentage / 100;
    } else {
      commission = rateGroupSelections.reduce((total, selection) => total + selection.commission, 0);
    }
    return NumberManager.roundout(commission);
  };

  const getPromoDiscount = () => {
    if (!appliedPromoCode) return 0;

    const tourSubtotal = getTourSubtotal();
    const discountValue = parseFloat(appliedPromoCode.discount_value);

    if (appliedPromoCode.discount_value_type === 'Percent') {
      return NumberManager.roundout((tourSubtotal * discountValue) / 100);
    } else {
      // Fixed Money - don't exceed tour subtotal
      return NumberManager.roundout(Math.min(discountValue, tourSubtotal));
    }
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

      return NumberManager.roundout(total + pricing.commission);
    }, 0);
  };

  const getTotalSubtotal = () => {
    const tourSubtotal = getTourSubtotal();
    const promoDiscount = getPromoDiscount();
    const addOnSubtotal = getAddOnSubtotal();

    return NumberManager.roundout(tourSubtotal - promoDiscount + addOnSubtotal);
  };

  const getTotalFees = () => {
    return NumberManager.roundout(getTourCommission() + getAddOnCommission());
  };

  const getTotalAmount = () => {
    return NumberManager.roundout(getTotalSubtotal() + getTotalFees());
  };

  const getTourFees = () => {
    return NumberManager.roundout(getTourCommission());
  };

  const getAddOnFees = () => {
    return NumberManager.roundout(getAddOnCommission());
  };

  const getAvailableSeats = () => {
    if (hasCustomRatesInSlots && selectedSlot) {
      return selectedSlot.seats;
    } else if (!hasCustomRatesInSlots && filteredTimeSlots.length > 0) {
      // For date-based booking, use the maximum available seats from all open slots
      const openSlots = filteredTimeSlots.filter(slot => slot.bookable_status === 'Open');
      return openSlots.length > 0 ? Math.max(...openSlots.map(slot => slot.seats)) : 0;
    }
    return 0;
  };

  const getRemainingSeats = () => {
    return getAvailableSeats() - getTotalGuests();
  };

  const canIncreaseQuantity = (currentQuantity: number) => {
    if (packageData?.is_group_rate_enabled === 1) {
      return selectedGroupSize + 1 <= getAvailableSeats();
    }
    const totalOtherGuests = getTotalGuests() - currentQuantity;
    return totalOtherGuests + currentQuantity + 1 <= getAvailableSeats();
  };

  const canIncreaseGroupSize = () => {
    return selectedGroupSize + 1 <= getAvailableSeats();
  };

  const getGroupSizeOptions = () => {
    const availableSeats = getAvailableSeats();

    // Get unique sizes from group rate options, filtered by available seats
    const uniqueSizes = [...new Set(groupRateOptions.map(rg => rg.size || 1))]
      .filter(size => size <= availableSeats)
      .sort((a, b) => a - b);

    return uniqueSizes.map(size => {
      const rateGroup = groupRateOptions.find(rg => (rg.size || 1) === size);
      return {
        size,
        rateFor: rateGroup?.rate_for || '',
        rate: rateGroup?.rate || '0'
      };
    });
  };

  const generateCalendarDays = () => {
    if (!packageData) return [];

    return TimezoneManager.generateCalendarDays(currentMonth, selectedDate, packageTimezone);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatDate = (dateStr: string) => {
    if (!packageData) return dateStr;

    return TimezoneManager.formatDateForDisplay(dateStr, packageTimezone);
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

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
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
      // Reset group size for group rate packages
      if (packageData?.is_group_rate_enabled === 1) {
        setSelectedGroupSize(0);
      }
    }
  };

  // Create cart item for booking actions
  const createCartItem = (): CartItem => {
    // Filter only selected add-ons based on their value and type
    const selectedAddOns = addOnFieldDetails.filter(detail => {
      // Always include if there's a value, regardless of pricing
      if (!detail.value && detail.value !== 0 && detail.value !== false) return false;
      
      switch (detail.type) {
        case 'checkbox':
          return detail.value === true;
        case 'radio':
          return detail.value !== '0' && detail.value !== '';
        case 'select':
          return detail.value !== '';
        case 'number':
          return detail.value > 0;
        case 'text':
        case 'textarea':
          return detail.value && detail.value.trim() !== '';
        default:
          return !!detail.value;
      }
    });

    return {
      id: `${resolvedParams.tenantId}-${resolvedParams.packageId}-${Date.now()}`,
      packageId: parseInt(resolvedParams.packageId),
      tenantId: resolvedParams.tenantId,
      packageName: packageData?.name || '',
      selectedDate,
      selectedSlot,
      rateGroupSelections: rateGroupSelections.filter(s => s.quantity > 0),
      addOnSelections,
      addOnFieldDetails: selectedAddOns,
      appliedPromoCode,
      pricing: {
        tourSubtotal: getTourSubtotal(),
        promoDiscount: getPromoDiscount(),
        addOnSubtotal: getAddOnSubtotal(),
        totalSubtotal: getTotalSubtotal(),
        totalFees: getTotalFees(),
        totalAmount: getTotalAmount(),
        tourFees: getTourFees(),
        addOnFees: getAddOnFees()
      },
      totalGuests: getTotalGuests(),
      createdAt: new Date().toISOString()
    };
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
                {packageData.timezone && (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {TimezoneManager.getTimezoneAbbreviation(packageTimezone)}
                  </span>
                )}
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
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                <h3 className="text-xl font-semibold text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
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
                    onClick={() => !day.isPast && day.isCurrentMonth && handleDateSelect(day.dateStr)}
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
                {packageData.timezone && (
                  <p className="text-xs text-blue-600 mt-1">
                    Timezone: {TimezoneManager.getTimezoneDisplayName(packageTimezone)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Time Slots Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Available Time Slots</h2>
              {TimezoneManager.isDateToday(selectedDate, packageTimezone) && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Current time</p>
                  <p className="text-sm font-medium text-blue-600">
                    {TimezoneManager.getCurrentTimeString(packageTimezone)} {TimezoneManager.getTimezoneAbbreviation(packageTimezone)}
                  </p>
                </div>
              )}
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading time slots...</span>
              </div>
            ) : filteredTimeSlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No time slots available</p>
                <p className="text-sm">
                  {TimezoneManager.isDateToday(selectedDate, packageTimezone)
                    ? 'All slots for today have passed or are closed'
                    : 'Please select a different date'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTimeSlots.map((slot) => {
                  const isSlotInPast = TimezoneManager.isDateToday(selectedDate, packageTimezone) &&
                    TimezoneManager.isTimeSlotInPast(slot.time, packageTimezone);

                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={slot.bookable_status === 'Closed' || isSlotInPast}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                        ${slot.bookable_status === 'Closed' || isSlotInPast
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
                            {slot.bookable_status === 'Open' && !isSlotInPast
                              ? `${slot.seats} seats available`
                              : isSlotInPast
                                ? 'Time has passed'
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
                            ${slot.bookable_status === 'Open' && !isSlotInPast
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }
                          `}>
                            {isSlotInPast ? 'Past' : slot.bookable_status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rate Groups Section */}
        {((selectedSlot && hasCustomRatesInSlots) || (!hasCustomRatesInSlots && filteredTimeSlots.length > 0)) && (rateGroups.length > 0 || groupRateOptions.length > 0) && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {packageData?.is_group_rate_enabled === 1 ? 'Select Group Size' : 'Select Guests'}
              </h3>
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
                {packageData?.is_group_rate_enabled === 1 ? (
                  /* Group Rate Selection */
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Group Sizes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getGroupSizeOptions().map((option) => (
                          <button
                            key={option.size}
                            onClick={() => handleGroupSizeChange(option.size)}
                            className={`
                              p-4 rounded-lg border-2 transition-all duration-200 text-left
                              ${selectedGroupSize === option.size
                                ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }
                            `}
                          >
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">{option.size}</p>
                              <p className="text-sm text-gray-600">people</p>
                              <p className="text-lg font-semibold text-green-600 mt-2">
                                ${parseFloat(option.rate).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">per group</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedGroupSize > 0 && rateGroupSelections.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-green-800">
                              Selected: Group of {selectedGroupSize} people
                            </p>
                            <p className="text-sm text-green-600">
                              {rateGroupSelections[0].rateGroup.rate_for}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-800">
                              ${rateGroupSelections[0].total.toFixed(2)}
                            </p>
                            <p className="text-xs text-green-600">
                              ${rateGroupSelections[0].subtotal.toFixed(2)} + ${rateGroupSelections[0].commission.toFixed(2)} fees
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Regular Rate Group Selection */
                  rateGroupSelections.map((selection, index) => (
                    <div key={selection.rateGroup.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{selection.rateGroup.rate_for}</h4>
                          <p className="text-sm text-gray-600">
                            ${parseFloat(selection.rateGroup.rate).toFixed(2)} per person
                            {selection.rateGroup.permit_fee && parseFloat(selection.rateGroup.permit_fee) > 0 && (
                              <span> + ${parseFloat(selection.rateGroup.permit_fee).toFixed(2)} permit fee</span>
                            )}
                            {selection.rateGroup.additional_charge && parseFloat(selection.rateGroup.additional_charge) > 0 && (
                              <span> + ${parseFloat(selection.rateGroup.additional_charge).toFixed(2)} additional charge</span>
                            )}
                            {selection.rateGroup.partner_fee_amount && parseFloat(selection.rateGroup.partner_fee_amount) > 0 && (
                              <span> + ${parseFloat(selection.rateGroup.partner_fee_amount).toFixed(2)} partner fee</span>
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
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 010-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
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
                  ))
                )}

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
                      onChange={(value) => handleAddOnChange(field.id, value)}
                      onFieldDetailsChange={handleFieldDetailsChange}
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
        {((selectedSlot && hasCustomRatesInSlots) || (!hasCustomRatesInSlots && filteredTimeSlots.length > 0)) && getTotalGuests() > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tour Details */}
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
                    <span className="font-medium">
                      {getTotalGuests()}
                      {packageData?.is_group_rate_enabled === 1 && ' (Group Rate)'}
                    </span>
                  </div>
                  {packageData.timezone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timezone:</span>
                      <span className="font-medium">{TimezoneManager.getTimezoneDisplayName(packageTimezone)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Pricing Breakdown</h4>

                {/* Tour Section */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-blue-900 mb-3">Tour Pricing</h5>
                  <div className="space-y-2">
                    {packageData?.is_group_rate_enabled === 1 ? (
                      /* Group Rate Display */
                      rateGroupSelections.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">
                            Group of {selectedGroupSize} - {rateGroupSelections[0].rateGroup.rate_for}
                          </span>
                          <span className="font-medium text-blue-800">${rateGroupSelections[0].subtotal.toFixed(2)}</span>
                        </div>
                      )
                    ) : (
                      /* Regular Rate Groups Display */
                      rateGroupSelections
                        .filter(selection => selection.quantity > 0)
                        .map((selection, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-blue-700">
                              {selection.quantity}x {selection.rateGroup.rate_for}
                            </span>
                            <span className="font-medium text-blue-800">${selection.subtotal.toFixed(2)}</span>
                          </div>
                        ))
                    )}

                    <div className="text-sm font-medium pt-2 border-t border-blue-200 space-y-2">
                      {/* Promo Discount */}
                      {appliedPromoCode && getPromoDiscount() > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">
                            Promo Discount ({appliedPromoCode.discount_value_type === 'Percent'
                              ? `${appliedPromoCode.discount_value}%`
                              : `$${appliedPromoCode.discount_value}`}):
                          </span>
                          <span className="text-green-600">-${getPromoDiscount().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-800">Tour Subtotal:</span>
                        <span className="text-blue-900">${(getTourSubtotal() - getPromoDiscount()).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-ons Section */}
                {getAddOnSubtotal() > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-purple-900 mb-3">Add-ons</h5>
                    <div className="space-y-2">
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
                              <span className="text-purple-700">{field.name}</span>
                              <span className="font-medium text-purple-800">${pricing.subtotal.toFixed(2)}</span>
                            </div>
                          );
                        })}

                      <div className="flex justify-between text-sm font-medium pt-2 border-t border-purple-200">
                        <span className="text-purple-800">Add-ons Subtotal:</span>
                        <span className="text-purple-900">${getAddOnSubtotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Totals */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">Total Subtotal:</span>
                      <span className="text-gray-900">${getTotalSubtotal().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Fees:</span>
                      <span className="text-gray-700">${getTotalFees().toFixed(2)}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total Amount:</span>
                        <span className="text-green-600">${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <BookingActions
                    cartItem={createCartItem()}
                    disabled={!selectedSlot && hasCustomRatesInSlots}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}