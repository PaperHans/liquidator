SELECT 
    w.address AS address,
    w.am_dai/1000000000000000000 AS am_dai,
    w.am_usdc/1000000 AS am_usdc,
    w.am_weth/1000000000000000000 AS am_weth,
    w.am_wbtc/100000000 AS am_wbtc,
    w.am_aave/1000000000000000000 AS am_aave,
    w.am_wmatic/1000000000000000000 AS am_wmatic,
    w.am_usdt/1000000 AS am_usdt,
    w.debt_dai/1000000000000000000 AS debt_dai,
    w.debt_usdc/1000000 AS debt_usdc,
    w.debt_weth/1000000000000000000 AS debt_weth,
    w.debt_wbtc/100000000 AS debt_wbtc,
    w.debt_aave/1000000000000000000 AS debt_aave,
    w.debt_wmatic/1000000000000000000 AS debt_wmatic,
    w.debt_usdt/1000000 AS debt_usdt,
    w.last_updated AS last_updated,
    m.dai/1000000000000000000 AS dai_price,
    m.usdc/1000000000000000000 AS usdc_price,
    m.weth/1000000000000000000 AS weth_price,
    m.wbtc/1000000000000000000 AS wbtc_price,
    m.aave/1000000000000000000 AS aave_price,
    m.wmatic/1000000000000000000 AS wmatic_price,
    m.usdt/1000000000000000000 AS usdt_price,
    (
        (w.am_dai*m.dai*0.8/1000000000000000000) +
        (w.am_usdc*m.usdc*0.85/1000000) +
        (w.am_weth*m.weth*0.825/1000000000000000000) +
        (w.am_wbtc*m.wbtc*0.75/100000000) +
        (w.am_aave*m.aave*0.65/1000000000000000000) +
        (w.am_wmatic*m.wmatic*0.65/1000000000000000000) +
        (w.am_usdt*m.usdt*0/1000000)
    ) AS total_collateral_eth,
    (
        (w.debt_dai*m.dai/1000000000000000000) +
        (w.debt_usdc*m.usdc/1000000) +
        (w.debt_weth*m.weth/1000000000000000000) +
        (w.debt_wbtc*m.wbtc/100000000) +
        (w.debt_aave*m.aave/1000000000000000000) +
        (w.debt_wmatic*m.wmatic/1000000000000000000) +
        (w.debt_usdt*m.usdt/1000000)
    ) AS total_debt_eth,
    (
        (
        (w.am_dai*m.dai*0.8/1000000000000000000) +
        (w.am_usdc*m.usdc*0.85/1000000) +
        (w.am_weth*m.weth*0.825/1000000000000000000) +
        (w.am_wbtc*m.wbtc*0.75/100000000) +
        (w.am_aave*m.aave*0.65/1000000000000000000) +
        (w.am_wmatic*m.wmatic*0.65/1000000000000000000) +
        (w.am_usdt*m.usdt*0/1000000)
        ) / (
        (w.debt_dai*m.dai/1000000000000000000) +
        (w.debt_usdc*m.usdc/1000000) +
        (w.debt_weth*m.weth/1000000000000000000) +
        (w.debt_wbtc*m.wbtc/100000000) +
        (w.debt_aave*m.aave/1000000000000000000) +
        (w.debt_wmatic*m.wmatic/1000000000000000000) +
        (w.debt_usdt*m.usdt/1000000)
        )
    ) AS health_factor
FROM user_balances w, price_data m 
WHERE (
(
    (w.am_dai*m.dai*0.8/1000000000000000000) +
    (w.am_usdc*m.usdc*0.85/1000000) +
    (w.am_weth*m.weth*0.825/1000000000000000000) +
    (w.am_wbtc*m.wbtc*0.75/100000000) +
    (w.am_aave*m.aave*0.65/1000000000000000000) +
    (w.am_wmatic*m.wmatic*0.65/1000000000000000000) +
    (w.am_usdt*m.usdt*0/1000000)
) / (
    (w.debt_dai*m.dai/1000000000000000000) +
    (w.debt_usdc*m.usdc/1000000) +
    (w.debt_weth*m.weth/1000000000000000000) +
    (w.debt_wbtc*m.wbtc/100000000) +
    (w.debt_aave*m.aave/1000000000000000000) +
    (w.debt_wmatic*m.wmatic/1000000000000000000) +
    (w.debt_usdt*m.usdt/1000000)
)
) <= 1
LIMIT 5;



SELECT 
    c.*,
    (
        ( am_dai * dai_price * 0.8 ) +
        ( am_usdc * usdc_price * 0.85 ) +
        ( am_weth * weth_price * 0.825 ) +
        ( am_wbtc * wbtc_price * 0.75 ) +
        ( am_aave * aave_price * 0.65 ) +
        ( am_wmatic * wmatic_price * 0.65 ) +
        ( am_usdt * usdt_price * 0 )
    ) AS total_collateral_eth,
    (
        ( debt_dai * dai_price ) +
        ( debt_usdc * usdc_price ) +
        ( debt_weth * weth_price ) +
        ( debt_wbtc * wbtc_price ) +
        ( debt_aave * aave_price ) +
        ( debt_wmatic * wmatic_price ) +
        ( debt_usdt * usdt_price )
    ) AS total_debt_eth,
    (
        ( am_dai * dai_price * 0.8 ) +
        ( am_usdc * usdc_price * 0.85 ) +
        ( am_weth * weth_price * 0.825 ) +
        ( am_wbtc * wbtc_price * 0.75 ) +
        ( am_aave * aave_price * 0.65 ) +
        ( am_wmatic * wmatic_price * 0.65 ) +
        ( am_usdt * usdt_price * 0 )
    ) / (
        ( debt_dai * dai_price ) +
        ( debt_usdc * usdc_price ) +
        ( debt_weth * weth_price ) +
        ( debt_wbtc * wbtc_price ) +
        ( debt_aave * aave_price ) +
        ( debt_wmatic * wmatic_price ) +
        ( debt_usdt * usdt_price )
    ) AS health_factor
FROM
    (SELECT 
        w.address AS address,
        w.am_dai/1000000000000000000 AS am_dai,
        w.am_usdc/1000000 AS am_usdc,
        w.am_weth/1000000000000000000 AS am_weth,
        w.am_wbtc/100000000 AS am_wbtc,
        w.am_aave/1000000000000000000 AS am_aave,
        w.am_wmatic/1000000000000000000 AS am_wmatic,
        w.am_usdt/1000000 AS am_usdt,
        w.debt_dai/1000000000000000000 AS debt_dai,
        w.debt_usdc/1000000 AS debt_usdc,
        w.debt_weth/1000000000000000000 AS debt_weth,
        w.debt_wbtc/100000000 AS debt_wbtc,
        w.debt_aave/1000000000000000000 AS debt_aave,
        w.debt_wmatic/1000000000000000000 AS debt_wmatic,
        w.debt_usdt/1000000 AS debt_usdt,
        m.dai/1000000000000000000 AS dai_price,
        m.usdc/1000000000000000000 AS usdc_price,
        m.weth/1000000000000000000 AS weth_price,
        m.wbtc/1000000000000000000 AS wbtc_price,
        m.aave/1000000000000000000 AS aave_price,
        m.wmatic/1000000000000000000 AS wmatic_price,
        m.usdt/1000000000000000000 AS usdt_price,
    FROM user_balances w, price_data m ) c 
LIMIT 100;





    
    (
        (
        (w.am_dai*m.dai*0.8/1000000000000000000) +
        (w.am_usdc*m.usdc*0.85/1000000) +
        (w.am_weth*m.weth*0.825/1000000000000000000) +
        (w.am_wbtc*m.wbtc*0.75/100000000) +
        (w.am_aave*m.aave*0.65/1000000000000000000) +
        (w.am_wmatic*m.wmatic*0.65/1000000000000000000) +
        (w.am_usdt*m.usdt*0/1000000)
        ) / (
        (w.debt_dai*m.dai/1000000000000000000) +
        (w.debt_usdc*m.usdc/1000000) +
        (w.debt_weth*m.weth/1000000000000000000) +
        (w.debt_wbtc*m.wbtc/100000000) +
        (w.debt_aave*m.aave/1000000000000000000) +
        (w.debt_wmatic*m.wmatic/1000000000000000000) +
        (w.debt_usdt*m.usdt/1000000)
        )
    ) AS health_factor
FROM user_balances w, price_data m 
WHERE (
(
    (w.am_dai*m.dai*0.8/1000000000000000000) +
    (w.am_usdc*m.usdc*0.85/1000000) +
    (w.am_weth*m.weth*0.825/1000000000000000000) +
    (w.am_wbtc*m.wbtc*0.75/100000000) +
    (w.am_aave*m.aave*0.65/1000000000000000000) +
    (w.am_wmatic*m.wmatic*0.65/1000000000000000000) +
    (w.am_usdt*m.usdt*0/1000000)
) / (
    (w.debt_dai*m.dai/1000000000000000000) +
    (w.debt_usdc*m.usdc/1000000) +
    (w.debt_weth*m.weth/1000000000000000000) +
    (w.debt_wbtc*m.wbtc/100000000) +
    (w.debt_aave*m.aave/1000000000000000000) +
    (w.debt_wmatic*m.wmatic/1000000000000000000) +
    (w.debt_usdt*m.usdt/1000000)
)
) <= 1
LIMIT 5;




CREATE MATERIALIZED VIEW health_data AS
SELECT 
  t.*,
  t.total_collateral_eth/t.total_debt_eth AS health_factor
FROM
(SELECT 
    w.address AS address,
    w.am_dai / 1000000000000000000 AS am_dai,
    w.am_usdc / 1000000 AS am_usdc,
    w.am_weth / 1000000000000000000 AS am_weth,
    w.am_wbtc / 100000000 AS am_wbtc,
    w.am_aave / 1000000000000000000 AS am_aave,
    w.am_wmatic / 1000000000000000000 AS am_wmatic,
    w.am_usdt / 1000000 AS am_usdt,
    w.debt_dai / 1000000000000000000 AS debt_dai,
    w.debt_usdc / 1000000 AS debt_usdc,
    w.debt_weth / 1000000000000000000 AS debt_weth,
    w.debt_wbtc / 100000000 AS debt_wbtc,
    w.debt_aave / 1000000000000000000 AS debt_aave,
    w.debt_wmatic / 1000000000000000000 AS debt_wmatic,
    w.debt_usdt / 1000000 AS debt_usdt,
    m.dai / 1000000000000000000 AS dai_price,
    m.usdc / 1000000000000000000 AS usdc_price,
    m.weth / 1000000000000000000 AS weth_price,
    m.wbtc / 1000000000000000000 AS wbtc_price,
    m.aave / 1000000000000000000 AS aave_price,
    m.wmatic / 1000000000000000000 AS wmatic_price,
    m.usdt / 1000000000000000000 AS usdt_price,
    (
        (w.am_dai * m.dai * 0.8 / 1000000000000000000) +
        (w.am_usdc * m.usdc * 0.85 / 1000000) +
        (w.am_weth * m.weth * 0.825 / 1000000000000000000) +
        (w.am_wbtc * m.wbtc * 0.75 / 100000000) +
        (w.am_aave * m.aave * 0.65 / 1000000000000000000) +
        (w.am_wmatic * m.wmatic * 0.65 / 1000000000000000000) +
        (w.am_usdt * m.usdt * 0 / 1000000)
    ) AS total_collateral_eth,
    (
        (w.debt_dai * m.dai / 1000000000000000000) +
        (w.debt_usdc * m.usdc / 1000000) +
        (w.debt_weth * m.weth / 1000000000000000000) +
        (w.debt_wbtc * m.wbtc / 100000000) +
        (w.debt_aave * m.aave / 1000000000000000000) +
        (w.debt_wmatic * m.wmatic / 1000000000000000000) +
        (w.debt_usdt * m.usdt / 1000000)
    ) AS total_debt_eth
FROM user_balances w, price_data m) t;



CREATE MATERIALIZED VIEW health_data AS
SELECT 
    w.address AS address,
    w.am_dai / 1000000000000000000 AS am_dai,
    w.am_usdc / 1000000 AS am_usdc,
    w.am_weth / 1000000000000000000 AS am_weth,
    w.am_wbtc / 100000000 AS am_wbtc,
    w.am_aave / 1000000000000000000 AS am_aave,
    w.am_wmatic / 1000000000000000000 AS am_wmatic,
    w.am_usdt / 1000000 AS am_usdt,
    w.debt_dai / 1000000000000000000 AS debt_dai,
    w.debt_usdc / 1000000 AS debt_usdc,
    w.debt_weth / 1000000000000000000 AS debt_weth,
    w.debt_wbtc / 100000000 AS debt_wbtc,
    w.debt_aave / 1000000000000000000 AS debt_aave,
    w.debt_wmatic / 1000000000000000000 AS debt_wmatic,
    w.debt_usdt / 1000000 AS debt_usdt,
    m.dai / 1000000000000000000 AS dai_price,
    m.usdc / 1000000000000000000 AS usdc_price,
    m.weth / 1000000000000000000 AS weth_price,
    m.wbtc / 1000000000000000000 AS wbtc_price,
    m.aave / 1000000000000000000 AS aave_price,
    m.wmatic / 1000000000000000000 AS wmatic_price,
    m.usdt / 1000000000000000000 AS usdt_price,
    (
        (w.am_dai * m.dai * 0.8 / 1000000000000000000) +
        (w.am_usdc * m.usdc * 0.85 / 1000000) +
        (w.am_weth * m.weth * 0.825 / 1000000000000000000) +
        (w.am_wbtc * m.wbtc * 0.75 / 100000000) +
        (w.am_aave * m.aave * 0.65 / 1000000000000000000) +
        (w.am_wmatic * m.wmatic * 0.65 / 1000000000000000000) +
        (w.am_usdt * m.usdt * 0 / 1000000)
    ) AS total_collateral_eth,
    (
        (w.debt_dai * m.dai / 1000000000000000000) +
        (w.debt_usdc * m.usdc / 1000000) +
        (w.debt_weth * m.weth / 1000000000000000000) +
        (w.debt_wbtc * m.wbtc / 100000000) +
        (w.debt_aave * m.aave / 1000000000000000000) +
        (w.debt_wmatic * m.wmatic / 1000000000000000000) +
        (w.debt_usdt * m.usdt / 1000000)
    ) AS total_debt_eth
FROM user_balances w, price_data m;

CREATE VIEW health_check AS
SELECT 
    c.*,
    NULLIF((
        ( am_dai * dai_price * 800/1000 ) +
        ( am_usdc * usdc_price * 850/1000 ) +
        ( am_weth * weth_price * 825/1000 ) +
        ( am_wbtc * wbtc_price * 750/1000 ) +
        ( am_aave * aave_price * 650/1000 ) +
        ( am_wmatic * wmatic_price * 650/1000 ) +
        ( am_usdt * usdt_price * 0 )
    ),0) AS total_collateral_eth,
    NULLIF((
        ( debt_dai * dai_price ) +
        ( debt_usdc * usdc_price ) +
        ( debt_weth * weth_price ) +
        ( debt_wbtc * wbtc_price ) +
        ( debt_aave * aave_price ) +
        ( debt_wmatic * wmatic_price ) +
        ( debt_usdt * usdt_price )
    ),0) AS total_debt_eth,
    NULLIF((
        ( am_dai * dai_price * 800/1000 ) +
        ( am_usdc * usdc_price * 850/1000 ) +
        ( am_weth * weth_price * 825/1000 ) +
        ( am_wbtc * wbtc_price * 750/1000 ) +
        ( am_aave * aave_price * 650/1000 ) +
        ( am_wmatic * wmatic_price * 650/1000 ) +
        ( am_usdt * usdt_price * 0 )
    ),0) / NULLIF((
        ( debt_dai * dai_price ) +
        ( debt_usdc * usdc_price ) +
        ( debt_weth * weth_price ) +
        ( debt_wbtc * wbtc_price ) +
        ( debt_aave * aave_price ) +
        ( debt_wmatic * wmatic_price ) +
        ( debt_usdt * usdt_price )
    ),0) AS health_factor
FROM
    (SELECT 
        w.address AS address,
        w.am_dai/1000000000000000000 AS am_dai,
        w.am_usdc/1000000 AS am_usdc,
        w.am_weth/1000000000000000000 AS am_weth,
        w.am_wbtc/100000000 AS am_wbtc,
        w.am_aave/1000000000000000000 AS am_aave,
        w.am_wmatic/1000000000000000000 AS am_wmatic,
        w.am_usdt/1000000 AS am_usdt,
        w.debt_dai/1000000000000000000 AS debt_dai,
        w.debt_usdc/1000000 AS debt_usdc,
        w.debt_weth/1000000000000000000 AS debt_weth,
        w.debt_wbtc/100000000 AS debt_wbtc,
        w.debt_aave/1000000000000000000 AS debt_aave,
        w.debt_wmatic/1000000000000000000 AS debt_wmatic,
        w.debt_usdt/1000000 AS debt_usdt,
        m.dai/1000000000000000000 AS dai_price,
        m.usdc/1000000000000000000 AS usdc_price,
        m.weth/1000000000000000000 AS weth_price,
        m.wbtc/1000000000000000000 AS wbtc_price,
        m.aave/1000000000000000000 AS aave_price,
        m.wmatic/1000000000000000000 AS wmatic_price,
        m.usdt/1000000000000000000 AS usdt_price
    FROM user_balances w, price_data m ) c;


SELECT 
    c.*,
    NULLIF((
        ( am_dai_eth * 800/1000 ) +
        ( am_usdc_eth * 850/1000 ) +
        ( am_weth_eth * 825/1000 ) +
        ( am_wbtc_eth * 750/1000 ) +
        ( am_aave_eth * 650/1000 ) +
        ( am_wmatic_eth * 650/1000 ) +
        ( am_usdt_eth * 0 )
    ),0) AS total_collateral_eth,
    NULLIF((
        ( debt_dai_eth ) +
        ( debt_usdc_eth ) +
        ( debt_weth_eth ) +
        ( debt_wbtc_eth ) +
        ( debt_aave_eth ) +
        ( debt_wmatic_eth ) +
        ( debt_usdt_eth )
    ),0) AS total_debt_eth,
    NULLIF((
        ( am_dai_eth * 800/1000 ) +
        ( am_usdc_eth * 850/1000 ) +
        ( am_weth_eth * 825/1000 ) +
        ( am_wbtc_eth * 750/1000 ) +
        ( am_aave_eth * 650/1000 ) +
        ( am_wmatic_eth * 650/1000 ) +
        ( am_usdt_eth * 0 )
    ),0) / NULLIF((
        ( debt_dai_eth ) +
        ( debt_usdc_eth ) +
        ( debt_weth_eth ) +
        ( debt_wbtc_eth ) +
        ( debt_aave_eth ) +
        ( debt_wmatic_eth ) +
        ( debt_usdt_eth )
    ),0) AS health_factor
FROM
    (SELECT 
        w.address AS address,
        (w.am_dai/1000000000000000000) * (m.dai/1000000000000000000) AS am_dai_eth,
        (w.am_usdc/1000000) * (m.usdc/1000000000000000000) AS am_usdc_eth,
        (w.am_weth/1000000000000000000) * (m.weth/1000000000000000000 ) AS am_weth_eth,
        (w.am_wbtc/100000000) * (m.wbtc/1000000000000000000 ) AS am_wbtc_eth,
        (w.am_aave/1000000000000000000) * (m.aave/1000000000000000000) AS am_aave_eth,
        (w.am_wmatic/1000000000000000000) * (m.wmatic/1000000000000000000) AS am_wmatic_eth,
        (w.am_usdt/1000000) * () AS am_usdt_eth,
        (w.debt_dai/1000000000000000000) * (m.dai/1000000000000000000) AS debt_dai_eth,
        (w.debt_usdc/1000000) * (m.usdc/1000000000000000000) AS debt_usdc_eth,
        (w.debt_weth/1000000000000000000) * (m.weth/1000000000000000000 ) AS debt_weth_eth,
        (w.debt_wbtc/100000000) * (m.wbtc/1000000000000000000 ) AS debt_wbtc_eth,
        (w.debt_aave/1000000000000000000) * (m.aave/1000000000000000000) AS debt_aave_eth,
        (w.debt_wmatic/1000000000000000000) * (m.wmatic/1000000000000000000) AS debt_wmatic_eth,
        (w.debt_usdt/1000000) * (m.usdt/1000000000000000000) AS debt_usdt_eth,
        m.dai/1000000000000000000 AS dai_price,
        m.usdc/1000000000000000000 AS usdc_price,
        m.weth/1000000000000000000 AS weth_price,
        m.wbtc/1000000000000000000 AS wbtc_price,
        m.aave/1000000000000000000 AS aave_price,
        m.wmatic/1000000000000000000 AS wmatic_price,
        m.usdt/1000000000000000000 AS usdt_price
    FROM user_balances w, price_data m ) c;



CREATE VIEW healthy AS
SELECT 
  c.*,
  NULLIF((
        ( c.am_dai_eth * 800/1000 ) +
        ( c.am_usdc_eth * 850/1000 ) +
        ( c.am_weth_eth * 825/1000 ) +
        ( c.am_wbtc_eth * 750/1000 ) +
        ( c.am_aave_eth * 650/1000 ) +
        ( c.am_wmatic_eth * 650/1000 ) +
        ( c.am_usdt_eth * 0 )
    ),0) AS total_collateral_eth,
    NULLIF((
        ( c.debt_dai_eth ) +
        ( c.debt_usdc_eth ) +
        ( c.debt_weth_eth ) +
        ( c.debt_wbtc_eth ) +
        ( c.debt_aave_eth ) +
        ( c.debt_wmatic_eth ) +
        ( c.debt_usdt_eth )
    ),0) AS total_debt_eth,
    NULLIF((
        ( c.am_dai_eth * 0.8 ) +
        ( c.am_usdc_eth * 0.85 ) +
        ( c.am_weth_eth * 0.825 ) +
        ( c.am_wbtc_eth * 0.75 ) +
        ( c.am_aave_eth * 0.65 ) +
        ( c.am_wmatic_eth * 0.65 ) +
        ( c.am_usdt_eth * 0 )
    ),0) / NULLIF((
        ( c.debt_dai_eth ) +
        ( c.debt_usdc_eth ) +
        ( c.debt_weth_eth ) +
        ( c.debt_wbtc_eth ) +
        ( c.debt_aave_eth ) +
        ( c.debt_wmatic_eth ) +
        ( c.debt_usdt_eth )
    ),0) AS health_factor
FROM
    (SELECT 
    w.address AS address,
    (w.am_dai/1000000000000000000) * (m.dai/1000000000000000000) AS am_dai_eth,
    (w.am_usdc/1000000) * (m.usdc/1000000000000000000) AS am_usdc_eth,
    (w.am_weth/1000000000000000000) * (m.weth/1000000000000000000 ) AS am_weth_eth,
    (w.am_wbtc/100000000) * (m.wbtc/1000000000000000000 ) AS am_wbtc_eth,
    (w.am_aave/1000000000000000000) * (m.aave/1000000000000000000) AS am_aave_eth,
    (w.am_wmatic/1000000000000000000) * (m.wmatic/1000000000000000000) AS am_wmatic_eth,
    (w.am_usdt/1000000) * (m.usdt/1000000000000000000) AS am_usdt_eth,
    (w.debt_dai/1000000000000000000) * (m.dai/1000000000000000000) AS debt_dai_eth,
    (w.debt_usdc/1000000) * (m.usdc/1000000000000000000) AS debt_usdc_eth,
    (w.debt_weth/1000000000000000000) * (m.weth/1000000000000000000 ) AS debt_weth_eth,
    (w.debt_wbtc/100000000) * (m.wbtc/1000000000000000000 ) AS debt_wbtc_eth,
    (w.debt_aave/1000000000000000000) * (m.aave/1000000000000000000) AS debt_aave_eth,
    (w.debt_wmatic/1000000000000000000) * (m.wmatic/1000000000000000000) AS debt_wmatic_eth,
    (w.debt_usdt/1000000) * (m.usdt/1000000000000000000) AS debt_usdt_eth,
    m.dai/1000000000000000000 AS dai_price,
    m.usdc/1000000000000000000 AS usdc_price,
    m.weth/1000000000000000000 AS weth_price,
    m.wbtc/1000000000000000000 AS wbtc_price,
    m.aave/1000000000000000000 AS aave_price,
    m.wmatic/1000000000000000000 AS wmatic_price,
    m.usdt/1000000000000000000 AS usdt_price
    FROM user_balances w, price_data m ) c;


    SELECT 
    *,
    LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) AS amt_to_liquidate
FROM healthy
WHERE 
  health_factor <= 1.00005 AND
  (
    LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) >= 0.00003
  )
  ORDER BY LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) DESC;
