import express from "express";
import { query, queryOne } from "../db.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  const totalUsers = await queryOne("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
  const totalStudents = await queryOne("SELECT COUNT(*) as count FROM users WHERE account_type = 'student'");
  const totalRegistration = await queryOne("SELECT COUNT(*) as count FROM users WHERE account_type IN ('registration','registration_sponsor')");
  const totalRegistrationOnly = await queryOne("SELECT COUNT(*) as count FROM users WHERE account_type = 'registration'");
  const totalRegistrationSponsor = await queryOne("SELECT COUNT(*) as count FROM users WHERE account_type = 'registration_sponsor'");
  const totalBlocked = await queryOne("SELECT COUNT(*) as count FROM users WHERE role != 'admin' AND blocked = 1");
  const totalCourses = await queryOne("SELECT COUNT(*) as count FROM courses");
  const totalRevenue = await queryOne("SELECT COALESCE(SUM(e_money), 0) as total FROM users");
  const pendingApprovals = await queryOne("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
  const topUpPending = await queryOne("SELECT COUNT(*) as count FROM top_up_requests WHERE status = 'pending'");
  const totalCommissions = await queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM commissions");
  const totalEnrollments = await queryOne("SELECT COUNT(*) as count FROM enrollments");
  const approvedEnrollments = await queryOne("SELECT COUNT(*) as count FROM enrollments WHERE status = 'approved'");
  const pendingEnrollments = await queryOne("SELECT COUNT(*) as count FROM enrollments WHERE status = 'pending'");
  const totalEMoney = await queryOne("SELECT COALESCE(SUM(e_money), 0) as total FROM users WHERE account_type = 'student'");
  const publishedCourses = await queryOne("SELECT COUNT(*) as count FROM courses WHERE status = 'published'");
  const purchaseRequests = await queryOne("SELECT COUNT(*) as count FROM enrollments WHERE status = 'pending' AND payment_method IS NOT NULL");
  const upgradeRequests = await queryOne("SELECT COUNT(*) as count FROM upgrade_requests WHERE status = 'pending'");

  res.json({
    totalUsers: totalUsers ? totalUsers.count : 0,
    totalStudents: totalStudents ? totalStudents.count : 0,
    totalGuest: totalRegistration ? totalRegistration.count : 0,
    totalRegistration: totalRegistration ? totalRegistration.count : 0,
    totalRegistrationOnly: totalRegistrationOnly ? totalRegistrationOnly.count : 0,
    totalRegistrationSponsor: totalRegistrationSponsor ? totalRegistrationSponsor.count : 0,
    totalBlocked: totalBlocked ? totalBlocked.count : 0,
    totalCourses: totalCourses ? totalCourses.count : 0,
    publishedCourses: publishedCourses ? publishedCourses.count : 0,
    totalRevenue: totalRevenue ? totalRevenue.total : 0,
    pendingApprovals: pendingApprovals ? pendingApprovals.count : 0,
    topUpPending: topUpPending ? topUpPending.count : 0,
    totalCommissions: totalCommissions ? totalCommissions.total : 0,
    totalEnrollments: totalEnrollments ? totalEnrollments.count : 0,
    approvedEnrollments: approvedEnrollments ? approvedEnrollments.count : 0,
    pendingEnrollments: pendingEnrollments ? pendingEnrollments.count : 0,
    totalEMoney: totalEMoney ? totalEMoney.total : 0,
    purchaseRequests: purchaseRequests ? purchaseRequests.count : 0,
    upgradeRequests: upgradeRequests ? upgradeRequests.count : 0,
  });
});

router.get("/public-stats", async (req, res) => {
  try {
    const totalMembers = await queryOne("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
    const totalCourses = await queryOne("SELECT COUNT(*) as count FROM courses WHERE status = 'published'");
    const totalRanks = await queryOne("SELECT COUNT(*) as count FROM ranks WHERE is_active = 1");
    const ratingResult = await queryOne("SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total FROM feedbacks");
    const avgRating = ratingResult ? Math.round((ratingResult.avg_rating / 5) * 100) : 95;
    res.json({
      totalMembers: totalMembers?.count || 0,
      totalCourses: totalCourses?.count || 0,
      totalRanks: totalRanks?.count || 0,
      satisfactionRate: avgRating > 0 ? avgRating : 95,
      totalFeedbacks: ratingResult?.total || 0,
    });
  } catch (err) {
    res.json({ totalMembers: 0, totalCourses: 0, totalRanks: 10, satisfactionRate: 95, totalFeedbacks: 0 });
  }
});

export default router;
