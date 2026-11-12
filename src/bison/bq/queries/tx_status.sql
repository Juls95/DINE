-- Bison · tx_status · v1  (M3 success rate; raw status values are kept so the success mapping is explicit in code)
-- Params: @start_date DATE, @end_date DATE (end exclusive)
SELECT
  FORMAT_DATE('%F', block_date) AS date,
  CAST(status AS STRING)        AS status,
  COUNT(*)                      AS transactions
FROM `bigquery-public-data.crypto_near_mainnet_us.transactions`
WHERE block_date >= @start_date
  AND block_date <  @end_date
GROUP BY block_date, status
ORDER BY block_date, status;
