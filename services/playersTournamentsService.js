const PlayersTournaments = require('../models/PlayersTournaments');
const { getActiveTournament } = require('../services/tournamentsService');
const Players = require('../models/Players')
const Users = require('../models/Users')
const tournamentService = require('./tournamentsService')

async function registerPlayer(playerId, rebuys, addon) {
  const activeTournament = await getActiveTournament();
  if (!activeTournament) {
    throw new Error('No active tournament found');
  }

  const playerTournament = await PlayersTournaments.create({
    playerId,
    tournamentId: activeTournament.id,
    rebuys,
    addon,
    total: 0, // Initial total, will be set in the hook
    player_status: 'in' // Initial status
  });

  return playerTournament;
}

// Function to eliminate a player from a tournament
async function eliminatePlayer(playerId, tournamentId) {
  try {
    const playerTournament = await PlayersTournaments.findOne({
      where: {
        playerId,
        tournamentId
      }
    });

    if (!playerTournament) {
      throw new Error('Player registration not found in tournament');
    }

    playerTournament.player_status = 'out';
    await playerTournament.save();

    return playerTournament;
  } catch (error) {
    console.error('Error eliminating player:', error);
    throw error;
  }
}

async function updatePlayer(playerId, rebuy, addon) {
  try {
    const activeTournament = await tournamentService.getActiveTournament();
    if (!activeTournament) {
      throw new Error('No active tournament found');
    }

    const playerTournament = await PlayersTournaments.findOne({
      where: {
        playerId,
        tournamentId: activeTournament.id,
      }
    });

    if (!playerTournament) {
      throw new Error('Player registration not found in tournament');
    }

    // Update rebuy and addon values
    playerTournament.rebuys = rebuy;
    playerTournament.addon = addon;
    await playerTournament.save();

    return { message: 'Player information updated successfully' };
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
}

async function getPlayersIn(tournamentId) {
  const playersIn = await PlayersTournaments.findAll({
    where: {
      tournamentId,
      player_status: 'in'
    },
    include: [{
      model: Players,
      as: 'Player',
      include: [{
        model: Users,
        as: 'User'
      }]
    }]
  });
  return playersIn;
}


async function getPlayersOut(tournamentId) {
  const playersOut = await PlayersTournaments.findAll({
    where: {
      tournamentId,
      player_status: 'out'
    },
    include: [{
      model: Players,
      as: 'Player',
      include: [{
        model: Users,
        as: 'User'
      }]
    }]
  });
  return playersOut;
}

module.exports = {
  registerPlayer,
  eliminatePlayer,
  updatePlayer,
  getPlayersIn,
  getPlayersOut
};
