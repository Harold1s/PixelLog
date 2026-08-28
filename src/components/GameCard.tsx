import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../lib/rawg';
import { Star } from 'lucide-react';

const GameCard: React.FC<{ game: Game }> = ({ game }) => {
  return (
    <Link to={`/game/${game.id}`} className="group block relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 transition-all hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10">
      <div className="aspect-[3/4] overflow-hidden">
        <img 
          src={game.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop'} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-lg line-clamp-1 mb-1">{game.name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-yellow-500 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
            <Star size={14} className="fill-current" />
            <span className="text-xs font-bold">{game.rating ? game.rating.toFixed(1) : 'N/A'}</span>
          </div>
          {game.released && (
            <span className="text-xs font-medium text-neutral-300 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
              {new Date(game.released).getFullYear()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default GameCard;
