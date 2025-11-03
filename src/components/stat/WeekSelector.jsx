import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import styles from "../../css/Statistics.module.css";

export function WeekSelector({ selectedWeek, onWeekChange }) {
    const today = new Date();
  
    const weeks = [];
    
    const currentWeekStart = startOfWeek(today);
    const currentWeekEnd = endOfWeek(today);
    weeks.push({
      value: "current",
      label: `Current Week (${format(currentWeekStart, "MMM d")} - ${format(currentWeekEnd, "MMM d, yyyy")})`,
      offset: 0
    });
    
    for (let i = 1; i <= 3; i++) {
      const weekStart = startOfWeek(addWeeks(today, i));
      const weekEnd = endOfWeek(addWeeks(today, i));
      weeks.push({
        value: `future-${i}`,
        label: `${i} Week${i > 1 ? 's' : ''} Ahead (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")})`,
        offset: i
      });
    }
  
    const currentIndex = weeks.findIndex((w) => w.value === selectedWeek);
  
    const handlePrevious = () => {
      if (currentIndex > 0) {
        onWeekChange(weeks[currentIndex - 1].value);
      }
    };
  
    const handleNext = () => {
      if (currentIndex < weeks.length - 1) {
        onWeekChange(weeks[currentIndex + 1].value);
      }
    };

  return (
    <div className={styles.weekSelector}>
      <button
        className={styles.weekSelectorButton}
        onClick={handlePrevious}
        disabled={currentIndex >= weeks.length - 1}
      >
        <ChevronLeft className={styles.weekSelectorIcon} />
      </button>

      <div className={styles.weekSelectorWrapper}>
        <Calendar className={styles.weekSelectorCalendar} />
        <select
          className={styles.weekSelectorSelect}
          value={selectedWeek}
          onChange={(e) => onWeekChange(e.target.value)}
        >
          {weeks.map((week) => (
            <option key={week.value} value={week.value}>
              {week.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className={styles.weekSelectorButton}
        onClick={handleNext}
        disabled={currentIndex <= 0}
      >
        <ChevronRight className={styles.weekSelectorIcon} />
      </button>
    </div>
  );
}