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
   * Get current date in the specified timezone
   */
  static getCurrentDateInTimezone(timezone: string): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Create a date in the target timezone
    const targetDate = new Date(utc + (this.getTimezoneOffset(timezone) * 60000));
    return targetDate;
  }

  /**
   * Get timezone offset in minutes for a given timezone
   */
  private static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    return (targetDate.getTime() - utcDate.getTime()) / (1000 * 60);
  }

  /**
   * Format date to YYYY-MM-DD string in the specified timezone
   */
  static formatDateToString(date: Date, timezone: string): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD format
    return formatter.format(date);
  }

  /**
   * Create a date object from YYYY-MM-DD string in the specified timezone
   */
  static createDateFromString(dateString: string, timezone: string): Date {
    // Parse the date string and create a date in the specified timezone
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create date in UTC first
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    
    // Adjust for timezone
    const timezoneOffset = this.getTimezoneOffset(timezone);
    return new Date(utcDate.getTime() - (timezoneOffset * 60000));
  }

  /**
   * Get today's date string in the specified timezone
   */
  static getTodayString(timezone: string): string {
    const today = this.getCurrentDateInTimezone(timezone);
    return this.formatDateToString(today, timezone);
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
   * Format date for display with timezone awareness
   */
  static formatDateForDisplay(dateString: string, timezone: string): string {
    const date = this.createDateFromString(dateString, timezone);
    
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
      const dateStr = this.formatDateToString(currentDate, timezone);
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