#!/bin/bash
sed -i '/<\/div>/!b;n;/^  );/!b;i\
      {showSearchModal && (\
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSearchModal(false)}>\
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>\
            <div className="flex items-center justify-between mb-4">\
              <h3 className="font-bold text-lg">اختر لعبة</h3>\
              <button onClick={() => setShowSearchModal(false)} className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">\
                <X size={24} />\
              </button>\
            </div>\
            <div className="relative mb-4">\
              <input\
                type="text"\
                value={searchQuery}\
                onChange={(e) => handleSearchTopGames(e.target.value)}\
                placeholder="ابحث عن لعبة..."\
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-indigo-500"\
              />\
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />\
            </div>\
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">\
              {searching ? (\
                <div className="flex justify-center py-10">\
                  <Loader2 className="animate-spin text-indigo-500" size={32} />\
                </div>\
              ) : (\
                searchResults.map(game => (\
                  <button\
                    key={game.id}\
                    onClick={() => handleAddTopGame(game)}\
                    className="w-full flex items-center gap-4 p-2 rounded-xl hover:bg-neutral-800 transition-colors text-right"\
                  >\
                    <img src={game.background_image} alt={game.name} className="w-16 h-16 rounded-lg object-cover" />\
                    <div className="font-bold text-white line-clamp-1">{game.name}</div>\
                  </button>\
                ))\
              )}\
              {!searching && searchQuery && searchResults.length === 0 && (\
                <div className="text-center py-10 text-neutral-500">لم يتم العثور على نتائج</div>\
              )}\
            </div>\
          </div>\
        </div>\
      )}\
' src/pages/ProfilePage.tsx
