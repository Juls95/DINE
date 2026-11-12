-- Bison · freshness · v1
-- Last day with blocks. Reads only the block_date partitions in the window.
-- Params: @start_date DATE, @end_date DATE (end exclusive)
SELECT FORMAT_DATE('%F', MAX(block_date)) AS last_block_date
FROM `bigquery-public-data.crypto_near_mainnet_us.blocks`
WHERE block_date >= @start_date
  AND block_date <  @end_date;
