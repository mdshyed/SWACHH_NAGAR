const User = require('../models/User.model');
const Badge = require('../models/Badge.model');
const UserBadge = require('../models/UserBadge.model');
const PointTransaction = require('../models/PointTransaction.model');
const Complaint = require('../models/Complaint.model');
const POINT_VALUES = require('../constants/pointValues');
const notificationService = require('./notification.service');
const logger = require('../config/logger');

const awardPoints = async (userId, action, referenceModel, referenceId, customPoints) => {
  const points = customPoints ?? POINT_VALUES[action] ?? 0;
  if (points === 0) return null;

  const user = await User.findById(userId);
  if (!user) return null;

  user.points += points;
  await user.save();

  const transaction = await PointTransaction.create({
    user: userId,
    points,
    action,
    reference: referenceModel ? { model: referenceModel, id: referenceId } : undefined,
    description: `${points > 0 ? '+' : ''}${points} points for ${action.replace(/_/g, ' ')}`,
    balance: user.points,
  });

  await notificationService.send({
    recipient: userId,
    type: 'points_awarded',
    title: { en: 'Points Earned!', hi: 'अंक मिले!' },
    body: { en: transaction.description, hi: `${points} अंक मिले: ${action.replace(/_/g, ' ')}` },
    data: { points, balance: user.points, action },
  });

  await checkAndAwardBadges(userId);

  return transaction;
};

const checkAndAwardBadges = async (userId) => {
  const [user, earnedBadges, allBadges, complaintCount] = await Promise.all([
    User.findById(userId),
    UserBadge.find({ user: userId }).distinct('badge'),
    Badge.find({ isActive: true }),
    Complaint.countDocuments({ reporter: userId, isDeleted: false }),
  ]);

  if (!user) return;

  for (const badge of allBadges) {
    if (earnedBadges.some((id) => id.equals(badge._id))) continue;

    let earned = false;
    const { type, threshold } = badge.criteria;

    if (type === 'complaint_count' && complaintCount >= threshold) earned = true;
    else if (type === 'points_threshold' && user.points >= threshold) earned = true;

    if (earned) {
      try {
        await UserBadge.create({ user: userId, badge: badge._id });
        user.points += badge.pointReward;
        await user.save();

        await notificationService.send({
          recipient: userId,
          type: 'badge_earned',
          title: { en: `Badge Earned: ${badge.name.en}`, hi: `बैज मिला: ${badge.name.hi}` },
          body: { en: badge.description?.en, hi: badge.description?.hi },
          data: { badgeId: badge._id, badgeKey: badge.key },
          reference: { model: 'Badge', id: badge._id },
        });

        logger.info(`Badge ${badge.key} awarded to user ${userId}`);
      } catch (err) {
        if (err.code !== 11000) logger.error(`Badge award failed: ${err.message}`);
      }
    }
  }
};

const getLeaderboard = async (period = 'all_time') => {
  return User.find({ isActive: true, isBanned: false })
    .select('name avatar points level')
    .sort({ points: -1 })
    .limit(50);
};

module.exports = { awardPoints, checkAndAwardBadges, getLeaderboard };
