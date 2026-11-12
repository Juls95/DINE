-- Bison · meta_tx · v1  (M8 meta-transactions: a relayer signs, the user is the receiver of the DELEGATE_ACTION receipt)
-- Params: @start_date DATE, @end_date DATE (end exclusive)
SELECT
  FORMAT_DATE('%F', block_date)                                                     AS date,
  COUNTIF(action_kind = 'DELEGATE_ACTION')                                          AS delegate_actions,
  COUNT(DISTINCT IF(action_kind = 'DELEGATE_ACTION', receipt_receiver_account_id, NULL)) AS delegating_accounts,
  COUNT(*)                                                                          AS total_actions
FROM `bigquery-public-data.crypto_near_mainnet_us.receipt_actions`
WHERE block_date >= @start_date
  AND block_date <  @end_date
GROUP BY block_date
ORDER BY block_date;
