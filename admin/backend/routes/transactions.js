import express from "express";
import { query } from "../db.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const { type, userId, fromDate, toDate, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 1) Referral commissions
    const commissions = await query(`
      SELECT c.id, c.amount, c.level, c.created_at,
        'commission' as tx_type,
        u1.id as from_user_id, u1.full_name as from_name, u1.email as from_email,
        u2.id as to_user_id, u2.full_name as to_name, u2.email as to_email,
        'عمولة إحالة - مستوى ' || c.level || ' (' || c.amount || ' EM)' as description,
        'completed' as status
      FROM commissions c
      JOIN users u1 ON c.from_user_id = u1.id
      JOIN users u2 ON c.to_user_id = u2.id
    `);

    // 2) User-to-user transfers
    const transfers = await query(`
      SELECT t.id, t.amount, NULL as level, t.created_at,
        'transfer' as tx_type,
        u1.id as from_user_id, u1.full_name as from_name, u1.email as from_email,
        u2.id as to_user_id, u2.full_name as to_name, u2.email as to_email,
        'تحويل من ' || u1.full_name || ' إلى ' || u2.full_name as description,
        t.status
      FROM transfers t
      JOIN users u1 ON t.from_user_id = u1.id
      JOIN users u2 ON t.to_user_id = u2.id
    `);

    // 3) Wallet transactions (top-ups, debits, credits)
    const walletTx = await query(`
      SELECT wt.id, wt.amount, NULL as level, wt.created_at,
        CASE WHEN wt.type = 'credit' THEN 'wallet_credit'
             WHEN wt.type = 'debit' THEN 'wallet_debit'
             ELSE 'wallet_' || wt.type END as tx_type,
        u.id as from_user_id, u.full_name as from_name, u.email as from_email,
        u.id as to_user_id, u.full_name as to_name, u.email as to_email,
        wt.description, wt.status
      FROM wallet_transactions wt
      JOIN users u ON wt.user_id = u.id
    `);

    // 4) Top-up requests
    const topups = await query(`
      SELECT tur.id, tur.amount, NULL as level, tur.created_at,
        'topup' as tx_type,
        u.id as from_user_id, u.full_name as from_name, u.email as from_email,
        u.id as to_user_id, u.full_name as to_name, u.email as to_email,
        'شحن رصيد - ' || COALESCE(tur.payment_method, '') || ' (' || tur.amount || ' EGP)' as description,
        tur.status
      FROM top_up_requests tur
      JOIN users u ON tur.user_id = u.id
    `);

    // 5) Rank bonuses
    const rankBonuses = await query(`
      SELECT rb.id, rb.amount, NULL as level, rb.created_at,
        'rank_bonus' as tx_type,
        u.id as from_user_id, u.full_name as from_name, u.email as from_email,
        u.id as to_user_id, u.full_name as to_name, u.email as to_email,
        'مكافأة ترقية - رتبة ' || rb.rank_name as description,
        'completed' as status
      FROM rank_bonuses rb
      JOIN users u ON rb.user_id = u.id
    `);

    // 6) Weekly commissions
    const weeklyComms = await query(`
      SELECT wc.id, wc.amount, NULL as level, wc.calculated_at as created_at,
        'weekly_commission' as tx_type,
        u.id as from_user_id, u.full_name as from_name, u.email as from_email,
        u.id as to_user_id, u.full_name as to_name, u.email as to_email,
        'العمولة الأسبوعية - رتبة ' || wc.rank_name || ' (' || wc.week_start || ')' as description,
        wc.status
      FROM weekly_commissions wc
      JOIN users u ON wc.user_id = u.id
    `);

    // 7) Admin logs that involve financial actions
    const adminFinancial = await query(`
      SELECT al.id, NULL as amount, NULL as level, al.created_at,
        'admin_action' as tx_type,
        al.admin_id as from_user_id, al.admin_name as from_name, '' as from_email,
        COALESCE(al.target_user_id, '') as to_user_id, COALESCE(al.target_user_name, '') as to_name, '' as to_email,
        al.details as description, 'completed' as status
      FROM admin_logs al
      WHERE al.action LIKE '%transfer%' OR al.action LIKE '%wallet%'
         OR al.action LIKE '%commission%' OR al.action LIKE '%topup%'
         OR al.action LIKE '%emoney%' OR al.action LIKE '%payment%'
    `);

    // Combine all
    let all = [
      ...commissions.map(r => ({ ...r, tx_type: 'commission' })),
      ...transfers.map(r => ({ ...r, tx_type: 'transfer' })),
      ...walletTx.map(r => ({ ...r })),
      ...topups.map(r => ({ ...r, tx_type: 'topup' })),
      ...rankBonuses.map(r => ({ ...r, tx_type: 'rank_bonus' })),
      ...weeklyComms.map(r => ({ ...r, tx_type: 'weekly_commission' })),
      ...adminFinancial.map(r => ({ ...r })),
    ];

    // Filter by type
    if (type && type !== 'all') {
      all = all.filter(t => t.tx_type === type);
    }

    // Filter by userId (involved in any way)
    if (userId) {
      all = all.filter(t => t.from_user_id === userId || t.to_user_id === userId);
    }

    // Filter by date range
    if (fromDate) {
      all = all.filter(t => t.created_at >= fromDate);
    }
    if (toDate) {
      all = all.filter(t => t.created_at <= toDate + ' 23:59:59');
    }

    // Sort by date descending
    all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    const total = all.length;
    const pageData = all.slice(offset, offset + parseInt(limit));

    res.json({
      transactions: pageData,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("Transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
