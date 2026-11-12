-- Bison · daily_activity · v1  (M1 daily active accounts, M2 transactions)
-- Params: @start_date DATE, @end_date DATE (end exclusive)
SELECT
  FORMAT_DATE('%F', block_date)     AS date,
  COUNT(DISTINCT signer_account_id) AS daily_active_accounts,
  COUNT(*)                          AS transactions
FROM `bigquery-public-data.crypto_near_mainnet_us.transactions`
WHERE block_date >= @start_date
  AND block_date <  @end_date
GROUP BY block_date
ORDER BY block_date;
