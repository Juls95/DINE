-- Bison · new_accounts · v1  (M4 accounts created per day)
-- Params: @start_date DATE, @end_date DATE (end exclusive)
SELECT
  FORMAT_DATE('%F', block_date) AS date,
  COUNT(*)                      AS new_accounts
FROM `bigquery-public-data.crypto_near_mainnet_us.receipt_actions`
WHERE block_date >= @start_date
  AND block_date <  @end_date
  AND action_kind = 'CREATE_ACCOUNT'
GROUP BY block_date
ORDER BY block_date;
