'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Tournament } from '@/lib/api/tournaments';

interface TournamentCardProps {
  tournament: Tournament;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get status of tournament
  const getTournamentStatus = () => {
    const now = Math.floor(Date.now() / 1000);
    
    if (now < tournament.startAt) {
      return { label: 'Upcoming', color: 'bg-blue-500' };
    } else if (now > tournament.endAt) {
      return { label: 'Completed', color: 'bg-gray-500' };
    } else {
      return { label: 'Ongoing', color: 'bg-green-500' };
    }
  };
  
  const status = getTournamentStatus();
  
  // Get primary image or placeholder
  const getImage = () => {
    if (tournament.images && tournament.images.length > 0) {
      return tournament.images[0].url;
    }
    return '/images/tournament-placeholder.jpg'; // Placeholder image
  };
  
  // Get location string
  const getLocation = () => {
    const parts = [];
    
    if (tournament.city) parts.push(tournament.city);
    if (tournament.addrState) parts.push(tournament.addrState);
    if (tournament.countryCode) parts.push(tournament.countryCode);
    
    return parts.join(', ') || 'Online Event';
  };
  
  return (
    <Link href={`/tournaments/${tournament.slug}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
        <div className="relative h-40 w-full bg-gray-200">
          {/* Tournament Image */}
          <Image
            src={getImage()}
            alt={tournament.name || 'Tournament image'}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={false}
          />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`${status.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          {/* Tournament Name */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
            {tournament.name}
          </h3>
          
          {/* Tournament Info */}
          <div className="space-y-2 text-sm text-gray-600">
            {/* Dates */}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {formatDate(tournament.startAt)} - {formatDate(tournament.endAt)}
              </span>
            </div>
            
            {/* Location */}
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{getLocation()}</span>
            </div>
            
            {/* Attendees */}
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{tournament.numAttendees || 0} Attendees</span>
            </div>
          </div>
          
          {/* Events Count */}
          <div className="mt-4 text-sm">
            <span className="text-indigo-600 font-medium">
              {tournament.events?.length || 0} Events
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}