-- Bison · contract_activity · v1  (M5 active contracts, M6 deploys, share of calls to the Intents contract)
-- Params: @start_date DATE, @end_date DATE (end exclusive), @intents_contract STRING
SELECT
  FORMAT_DATE('%F', block_date)                                                   AS date,
  COUNTIF(action_kind = 'FUNCTION_CALL')                                          AS function_calls,
  COUNT(DISTINCT IF(action_kind = 'FUNCTION_CALL', receipt_receiver_account_id, NULL)) AS active_contracts,
  COUNTIF(action_kind = 'DEPLOY_CONTRACT')                                        AS deploys,
  COUNTIF(action_kind = 'FUNCTION_CALL' AND receipt_receiver_account_id = @intents_contract) AS intents_calls
FROM `bigquery-public-data.crypto_near_mainnet_us.receipt_actions`
WHERE block_date >= @start_date
  AND block_date <  @end_date
GROUP BY block_date
ORDER BY block_date;
