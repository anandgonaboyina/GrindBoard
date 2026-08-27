"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

export default function CustomDatePicker({ value, onChange, placeholder = "Select Target Date" }: { value: string, onChange: (date: string) => void, placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => value ? new Date(value) : new Date());
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (value) {
        const parts = value.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          setCurrentDate(new Date(parts[0], parts[1] - 1, parts[2]));
        } else {
          setCurrentDate(new Date());
        }
      } else {
        setCurrentDate(new Date());
      }
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleSelect = (day: number) => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const realToday = new Date();

  return (
    <div className="relative w-full z-50">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-between"
      >
        <span className={value ? "text-white text-sm font-medium" : "text-white/30 text-sm font-normal"}>
          {value || placeholder}
        </span>
        <Calendar size={16} className="text-white/40" />
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div ref={popupRef} className="relative w-72 bg-gray-900 border border-white/20 rounded-3xl shadow-2xl p-5 z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div className="text-white font-medium text-sm tracking-wide">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = value === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = realToday.getFullYear() === currentDate.getFullYear() && realToday.getMonth() === currentDate.getMonth() && realToday.getDate() === day;
                
                return (
                  <button
                    key={day}
                    onClick={(e) => { e.preventDefault(); handleSelect(day); }}
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-all mx-auto flex items-center justify-center
                      ${isSelected
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 font-bold'
                        : isToday
                          ? 'border border-blue-400 text-blue-300 font-bold hover:bg-blue-500/20'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
