'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getInitials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AA';
}

export default function TestimonialSlider({ testimonials = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || testimonials.length === 0) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [isPaused, testimonials.length]);

  function goToPrevious() {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }

  function goToNext() {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }

  if (testimonials.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimoni siswa dan orang tua AAA Sport Academy"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative mx-auto max-w-4xl"
    >
      <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-xl shadow-blue-950/5">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.id}
              aria-hidden={index !== activeIndex}
              className="min-w-full px-6 py-8 text-center sm:px-12 sm:py-12"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0066CC]">
                <Quote className="h-6 w-6" />
              </span>

              <div className="mt-5 flex justify-center gap-1" aria-label={`Rating ${testimonial.rating} dari 5`}>
                {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                  <Star key={starIndex} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="mx-auto mt-5 max-w-2xl text-balance text-xl font-semibold leading-relaxed text-slate-800 sm:text-2xl">
                “{testimonial.quote}”
              </blockquote>

              <div className="mt-7 flex items-center justify-center gap-3">
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-extrabold text-white', testimonial.avatarTone)}>
                  {testimonial.initials}
                </span>
                <span className="text-left">
                  <span className="block font-extrabold text-slate-900">{testimonial.name}</span>
                  <span className="block text-sm text-slate-500">{testimonial.role}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={goToPrevious}
        aria-label="Testimoni sebelumnya"
        className="absolute -left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-600 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50 hover:text-[#0066CC] sm:-left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        aria-label="Testimoni berikutnya"
        className="absolute -right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-600 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50 hover:text-[#0066CC] sm:-right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-6 flex justify-center gap-2">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Tampilkan testimoni ${index + 1}`}
            aria-current={index === activeIndex}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              index === activeIndex ? 'w-9 bg-[#0066CC]' : 'w-2.5 bg-blue-200 hover:bg-blue-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}
