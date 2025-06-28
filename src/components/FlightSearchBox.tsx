"use client";

import { useState } from 'react';
import { MapPin, CalendarDays, UserCircle2, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { tr } from 'date-fns/locale';
import { format } from 'date-fns';
import { searchAirports } from '@/services/flightApi';
import { Airport } from '@/types/flight';

const DateInput = dynamic(() => import('./DateInput'), { ssr: false });

interface FlightSearchBoxProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialTripType?: string;
  initialDepartureDate?: string | Date;
  initialReturnDate?: string | Date;
  initialPassengers?: string | number;
  onSubmit: (params: {
    origin: string;
    destination: string;
    tripType: string;
    departureDate: string;
    returnDate?: string;
    passengers: string;
  }) => void;
}

export default function FlightSearchBox({
  initialOrigin = '',
  initialDestination = '',
  initialTripType = 'oneWay',
  initialDepartureDate = '',
  initialReturnDate = '',
  initialPassengers = '1',
  onSubmit,
}: FlightSearchBoxProps) {
  const [tripType, setTripType] = useState(initialTripType);
  const [fromAirport, setFromAirport] = useState(initialOrigin);
  const [toAirport, setToAirport] = useState(initialDestination);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(initialDepartureDate ? new Date(initialDepartureDate) : undefined);
  const [returnDate, setReturnDate] = useState<Date | undefined>(initialReturnDate ? new Date(initialReturnDate) : undefined);
  const [fromSuggestions, setFromSuggestions] = useState<Airport[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Airport[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [adultCount, setAdultCount] = useState(Number(initialPassengers) || 1);
  const [childCount, setChildCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Havaalanı arama fonksiyonu (yeni servis üzerinden)
  const handleAirportSearch = async (query: string, setSuggestions: React.Dispatch<React.SetStateAction<Airport[]>>) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchAirports(query);
      setSuggestions(results);
    } catch (error) {
      console.error("Havalimanı arama hatası:", error);
      setSuggestions([]); // Hata durumunda listeyi temizle
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromAirport(value);
    setShowFromSuggestions(true);
    handleAirportSearch(value, setFromSuggestions);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToAirport(value);
    setShowToSuggestions(true);
    handleAirportSearch(value, setToSuggestions);
  };

  const handleSelectFrom = (airport: Airport) => {
    setFromAirport(`${airport.code} - ${airport.name}`);
    setShowFromSuggestions(false);
  };

  const handleSelectTo = (airport: Airport) => {
    setToAirport(`${airport.code} - ${airport.name}`);
    setShowToSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAirport || !toAirport || !departureDate) return;
    setIsLoading(true);
    onSubmit({
      origin: fromAirport,
      destination: toAirport,
      tripType,
      departureDate: departureDate.toISOString().slice(0, 10),
      returnDate: tripType === 'roundTrip' && returnDate ? returnDate.toISOString().slice(0, 10) : undefined,
      passengers: String(adultCount + childCount + infantCount),
    });
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-lg p-4 border border-gray-200 flex flex-row flex-nowrap gap-4 items-end w-full">
        {/* Nereden */}
        <div className="flex flex-col min-w-[130px] flex-shrink-0 flex-grow-0">
          <label className="text-xs text-green-700 mb-1 ml-1 font-medium">Nereden</label>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nereden"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={fromAirport}
              onChange={handleFromChange}
              onFocus={() => setShowFromSuggestions(true)}
            />
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {fromSuggestions.map(airport => (
                  <li
                    key={airport.code}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => handleSelectFrom(airport)}
                  >
                    {airport.name} ({airport.code})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Nereye */}
        <div className="flex flex-col min-w-[130px] flex-shrink-0 flex-grow-0">
          <label className="text-xs text-green-700 mb-1 ml-1 font-medium">Nereye</label>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nereye"
              className="w-full pl-10 pr-4 py-3 border-y border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={toAirport}
              onChange={handleToChange}
              onFocus={() => setShowToSuggestions(true)}
            />
            {showToSuggestions && toSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {toSuggestions.map(airport => (
                  <li
                    key={airport.code}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => handleSelectTo(airport)}
                  >
                    {airport.name} ({airport.code})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Gidiş Tarihi */}
        <div className="flex flex-col min-w-[130px] flex-shrink-0 flex-grow-0">
          <label className="text-xs text-green-700 mb-1 ml-1 font-medium">Gidiş Tarihi</label>
          <div className="relative w-full flex items-center">
            <CalendarDays className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <DateInput
              value={departureDate}
              onChange={setDepartureDate}
              className="w-full pl-8 pr-2 py-2.5 text-base text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent border border-gray-200 rounded-lg cursor-pointer"
              placeholder="gg.aa.yyyy"
            />
          </div>
        </div>
        {/* Dönüş Tarihi ve Tek Yön */}
        <div className="flex flex-col min-w-[130px] flex-shrink-0 flex-grow-0">
          <div className="flex items-center mb-1 ml-1 gap-2">
            <label className="text-xs text-green-700 font-medium">Dönüş Tarihi</label>
            <label className="flex items-center gap-1 text-xs text-green-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tripType === 'oneWay'}
                onChange={e => setTripType(e.target.checked ? 'oneWay' : 'roundTrip')}
                className="accent-green-500"
              />
              Tek Yön
            </label>
          </div>
          <div className="relative w-full flex items-center">
            <CalendarDays className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <DateInput
              value={returnDate}
              onChange={setReturnDate}
              className={`w-full pl-8 pr-2 py-2.5 text-base text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent border border-gray-200 rounded-lg cursor-pointer ${tripType === 'oneWay' ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={tripType === 'oneWay' ? 'Tek Yön' : 'gg.aa.yyyy'}
              disabled={tripType === 'oneWay'}
            />
          </div>
        </div>
        {/* Yolcu */}
        <div className="flex flex-col min-w-[130px] flex-shrink-0 flex-grow-0">
          <label className="text-xs text-green-700 mb-1 ml-1 font-medium">Yolcu</label>
          <div className="relative w-full flex items-center">
            <UserCircle2 className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassengerModal(true)}
              className="w-full pl-8 pr-2 py-2.5 text-base text-gray-700 text-left focus:outline-none bg-transparent border border-gray-200 rounded-lg appearance-none cursor-pointer"
            >
              {adultCount} Yetişkin{childCount > 0 ? `, ${childCount} Çocuk` : ''}{infantCount > 0 ? `, ${infantCount} Bebek` : ''}
            </button>
            {showPassengerModal && (
              <div className="absolute z-20 top-14 right-0 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                <div className="flex flex-col gap-3">
                  {/* Yetişkin */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Yetişkin <span className="text-gray-500 text-sm">(12 yaş ve üstü)</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAdultCount(Math.max(1, adultCount-1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 disabled:opacity-40" disabled={adultCount === 1}>-</button>
                      <span className="w-4 text-center font-semibold text-gray-800">{adultCount}</span>
                      <button onClick={() => setAdultCount(adultCount+1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-green-600">+</button>
                    </div>
                  </div>
                  {/* Çocuk */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Çocuk <span className="text-gray-500 text-sm">(2-12 yaş)</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setChildCount(Math.max(0, childCount-1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 disabled:opacity-40" disabled={childCount === 0}>-</button>
                      <span className="w-4 text-center font-semibold text-gray-800">{childCount}</span>
                      <button onClick={() => setChildCount(childCount+1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-green-600">+</button>
                    </div>
                  </div>
                  {/* Bebek */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="font-medium text-gray-800">Bebek <span className="text-gray-500 text-sm">(0-2 yaş)</span></div>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setInfantCount(Math.max(0, infantCount-1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 disabled:opacity-40" disabled={infantCount === 0}>-</button>
                      <span className="w-4 text-center font-semibold text-gray-800">{infantCount}</span>
                      <button onClick={() => setInfantCount(infantCount+1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-green-600">+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowPassengerModal(false)} className="mt-4 w-full py-2 rounded-xl bg-green-500 text-white font-semibold">Tamam</button>
              </div>
            )}
          </div>
        </div>
        {/* Ara Butonu */}
        <div className="flex flex-col min-w-[90px] flex-none">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-shrink-0 px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 transition disabled:bg-gray-400"
          >
            {isLoading ? '...' : 'Düzenle'}
          </button>
        </div>
      </form>
    </div>
  );
}
