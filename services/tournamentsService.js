const Tournaments = require('../models/Tournaments');
const PlayersTournaments = require('../models/PlayersTournaments');
const Levels = require('../models/Levels');
const { Op } = require('sequelize');
const playersTournamentsService = require('./playersTournamentsService');

// Function to create a new tournament
async function createTournament(data) {
  const { buyin_money, buyin_chips, rebuy_money, rebuy_chips, addon_money, addon_chips, levels } = data;

  const tournament = await Tournaments.create({
    buyin_money,
    buyin_chips,
    rebuy_money,
    rebuy_chips,
    addon_money,
    addon_chips,
  });

  for (const level of levels) {
    await Levels.create({
      duration: level.duration,
      small_blind: level.small_blind,
      big_blind: level.big_blind,
      tournamentId: tournament.id
    });
  }

  // Ensure only the newly created tournament is active
  await setActiveTournament(tournament);

  return tournament;
}

// Function to get a tournament by ID
async function getTournamentById(id) {
  const tournament = await Tournaments.findByPk(id, {
    include: [{ model: Levels, as: 'Levels' }]
  });

  await setActiveTournament(tournament);

  return tournament;
}

// Function to update a tournament
async function updateTournament(id, data) {
  const { buyin_money, buyin_chips, rebuy_money, rebuy_chips, addon_money, addon_chips, levels } = data;

  const tournament = await Tournaments.findByPk(id);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  await tournament.update({
    buyin_money,
    buyin_chips,
    rebuy_money,
    rebuy_chips,
    addon_money,
    addon_chips,
  });

  await Levels.destroy({ where: { tournamentId: id } });

  for (const level of levels) {
    await Levels.create({
      duration: level.duration,
      small_blind: level.small_blind,
      big_blind: level.big_blind,
      tournamentId: id
    });
  }

  await setActiveTournament(tournament);

  return tournament;
}

// Function to delete a tournament
async function deleteTournament(id) {
  const tournament = await Tournaments.findByPk(id);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  await Levels.destroy({ where: { tournamentId: id } });
  await tournament.destroy();

  return { message: 'Tournament deleted successfully' };
}

// Function to get the active tournament
async function getActiveTournament() {
  const tournament = await Tournaments.findOne({
    where: { is_active: true },
    include: [{ model: Levels, as: 'Levels' }]
  });
  return tournament;
}

// Helper function to set the active tournament
async function setActiveTournament(tournament) {
  await Tournaments.update({ is_active: false }, {
    where: {
      id: { [Op.not]: tournament.id }
    },
  });
  tournament.is_active = true;
}

async function updatePotTotal(tournamentId) {
  const tournament = await Tournaments.findByPk(tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const totalPot = await PlayersTournaments.sum('total', {
    where: {
      tournamentId
    }
  });

  tournament.pot_total = totalPot;
  await tournament.save();
}

async function updateChipCount(tournamentId) {
  const tournament = await Tournaments.findByPk(tournamentId);

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const playerCount = await PlayersTournaments.count({
    where: {
      tournamentId
    }
  });
  const rebuyCount = await playersTournamentsService.getRebuyCount(tournamentId)
  const addonCount = await playersTournamentsService.getAddonCount(tournamentId)

  tournament.chip_count = (playerCount * tournament.buyin_chips) + (rebuyCount * tournament.rebuy_chips) + (addonCount * tournament.addon_chips);
  await tournament.save();
}
module.exports = {
  createTournament,
  getTournamentById,
  updateTournament,
  deleteTournament,
  getActiveTournament,
  updatePotTotal,
  updateChipCount
};
