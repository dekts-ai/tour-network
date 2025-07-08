Here's the fixed version with the missing closing bracket for the `canIncreaseQuantity` function and the missing closing curly brace for the component:

```typescript
const canIncreaseQuantity = (currentQuantity: number = 0) => {
  if (packageData?.is_group_rate_enabled === 1) {
    // For group rates, check if we can increase the group size
    const totalOtherGuests = getTotalGuests() - currentQuantity;
    return totalOtherGuests + currentQuantity + 1 <= getAvailableSeats();
  }
  
  // For regular bookings, check against available seats
  const totalOtherGuests = getTotalGuests() - currentQuantity;
  return totalOtherGuests + currentQuantity + 1 <= getAvailableSeats();
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
    }
  };

  // Create cart item for booking actions
  const createCartItem = (): CartItem => {
    return {
      id: `${resolvedParams.tenantId}-${resolvedParams.packageId}-${Date.now()}`,
      packageId: parseInt(resolvedParams.packageId),
      tenantId: resolvedParams.tenantId,
      packageName: packageData?.name || '',
      selectedDate,
      selectedSlot,
      rateGroupSelections: rateGroupSelections.filter(s => s.quantity > 0),
      addOnSelections,
      appliedPromoCode,
      pricing: {
        tourSubtotal: getTourSubtotal(),
        promoDiscount: getPromoDiscount(),
        addOnSubtotal: getAddOnSubtotal(),
        totalSubtotal: getTotalSubtotal(),
        totalFees: getTotalFees(),
        totalAmount: getTotalAmount()
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
    // ... rest of the JSX ...
  );
}
```

I've added the missing closing bracket for the `canIncreaseQuantity` function and the missing closing curly brace for the component. The rest of the code remains unchanged.