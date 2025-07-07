/**
 * Timezone utility functions for handling date operations across different timezones
 */

export class TimezoneManager {
  private static readonly DEFAULT_TIMEZONE = 'America/Phoenix';

  /**
   * Get the timezone to use for a package
   */
  static getPackageTimezone(packageTimezone?: string): string {
    return packageTimezone || this.DEFAULT_TIMEZONE;
  }

  /**
   * Get current date and time in the specified timezone
   */
  static getCurrentDateTimeInTimezone(timezone: string): Date {
    // Get current time in the specified timezone
    const now = new Date();
    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return timeInTimezone;
  }

  /**
   * Get current date in the specified timezone
   */
  static getCurrentDateInTimezone(timezone: string): Date {
    const dateTime = this.getCurrentDateTimeInTimezone(timezone);
    // Reset time to start of day
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
  }

  /**
   * Format date to YYYY-MM-DD string (for API calls)
   */
  static formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Create a date object from YYYY-MM-DD string
   */
  static createDateFromString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get today's date string in the specified timezone
   */
  static getTodayString(timezone: string): string {
    const today = this.getCurrentDateInTimezone(timezone);
    return this.formatDateToString(today);
  }

  /**
   * Get current time in HH:MM format for the specified timezone
   */
  static getCurrentTimeString(timezone: string): string {
    const now = this.getCurrentDateTimeInTimezone(timezone);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Check if a date is in the past relative to the timezone
   */
  static isDateInPast(dateString: string, timezone: string): boolean {
    const today = this.getTodayString(timezone);
    return dateString < today;
  }

  /**
   * Check if a date is today in the specified timezone
   */
  static isDateToday(dateString: string, timezone: string): boolean {
    const today = this.getTodayString(timezone);
    return dateString === today;
  }

  /**
   * Check if a time slot is in the past for today's date
   */
  static isTimeSlotInPast(slotTime: string, timezone: string): boolean {
    const currentTime = this.getCurrentTimeString(timezone);
    return slotTime < currentTime;
  }

  /**
   * Filter time slots based on timezone and current time
   */
  static filterFutureSlots(slots: any[], selectedDate: string, timezone: string): any[] {
    const isToday = this.isDateToday(selectedDate, timezone);
    
    if (!isToday) {
      // If not today, return all slots
      return slots;
    }

    // If today, filter out past time slots
    return slots.filter(slot => {
      if (slot.bookable_status === 'Closed') {
        return true; // Keep closed slots for display
      }
      
      // For open slots, check if time has passed
      return !this.isTimeSlotInPast(slot.time, timezone);
    });
  }

  /**
   * Format date for display with timezone awareness
   */
  static formatDateForDisplay(dateString: string, timezone: string): string {
    const date = this.createDateFromString(dateString);
    
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate calendar days for a specific month in the given timezone
   */
  static generateCalendarDays(currentMonth: Date, selectedDate: string, timezone: string) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    const todayString = this.getTodayString(timezone);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = this.formatDateToString(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isPast = this.isDateInPast(dateStr, timezone);
      const isToday = this.isDateToday(dateStr, timezone);
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
  }

  /**
   * Get the current month for calendar display in the specified timezone
   */
  static getCurrentMonth(timezone: string): Date {
    const currentDate = this.getCurrentDateInTimezone(timezone);
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }

  /**
   * Get timezone display name
   */
  static getTimezoneDisplayName(timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'long'
      });
      
      const parts = formatter.formatToParts(new Date());
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      return timeZonePart?.value || timezone;
    } catch {
      return timezone;
    }
  }

  /**
   * Get timezone abbreviation
   */
  static getTimezoneAbbreviation(timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      
      const parts = formatter.formatToParts(new Date());
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      return timeZonePart?.value || timezone;
    } catch {
      return timezone;
    }
  }

  /**
   * Validate if a timezone string is valid
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
}