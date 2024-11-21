import React from "react";

function Card({ card, isRevealed, onClick }) {
  return (
    <div
      className={`max-w-sm rounded-lg shadow-lg ${
        isRevealed ? "bg-gray-800" : "bg-gray-700"
      } p-2 text-white overflow-hidden transform transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer`}
      onClick={() => !isRevealed && onClick(card)}
    >
      {/* Card Image */}
      {isRevealed ? (
        <img
          src={card?.url}
          alt={card?.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-500 flex justify-center items-center text-2xl text-white font-semibold">
          🤔 ??
        </div>
      )}

      {/* Card Details */}
      <div className="p-3 text-left">
        {isRevealed ? (
          <>
            <h2 className="text-lg font-semibold">{card?.name}</h2>
            <p className="text-gray-400 mt-1 text-sm">ID: {card?.id}</p>
            <div className="flex gap-1 justify-between mt-3">
              <div className="text-xs font-bold text-gray-500">Power:</div>
              <div className="font-bold text-green-400 text-sm">
                {card?.pow.toLocaleString()} POW
              </div>
            </div>
          </>
        ) : (
          <p className="text-lg font-semibold text-white">Click to reveal</p>
        )}
      </div>
    </div>
  );
}

export default Card;
