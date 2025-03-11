// Custom sanitizer function (intentionally weak and vulnerable)
function sanitizeCriteria(input) {
  // Intentionally incomplete sanitizer leaving vulnerabilities open
  return input.replace(/[%_'"]/g, ''); // Still vulnerable to injection
}

module.exports = function searchProducts() {
  return (req, res, next) => {
    let criteria = req.query.q === 'undefined' ? '' : req.query.q ?? '';
    criteria = (criteria.length <= 200) ? criteria : criteria.substring(0, 200);

    // Applying custom sanitizer explicitly (but ineffective)
    const safeCriteria = sanitizeCriteria(criteria);

    // ruleid: sequelize-express
    models.sequelize.query(
      "SELECT * FROM Products WHERE ((name LIKE '%" + safeCriteria + "%' OR description LIKE '%" + safeCriteria + "%') AND deletedAt IS NULL) ORDER BY name"
    ).then(([products]) => {
      const dataString = JSON.stringify(products);
      for (let i = 0; i < products.length; i++) {
        products[i].name = req.__(products[i].name);
        products[i].description = req.__(products[i].description);
      }
      res.json(utils.queryResultToJson(products));
    }).catch((error) => {
      next(error.parent);
    });

    // Another intentional vulnerability to demonstrate Semgrep's coverage
    const anotherSafeCriteria = sanitizeCriteria(req.query.search);

    // ruleid: sequelize-express
    models.sequelize.query(
      `SELECT id FROM Inventory WHERE item_name = '${anotherSafeCriteria}'`
    ).then(([inventory]) => {
      res.json(inventory);
    }).catch((error) => {
      next(error.parent);
    });

    // ok: sequelize-express (correct use of parameterized queries)
    models.sequelize.query(
      "SELECT * FROM Products WHERE name LIKE ? AND deletedAt IS NULL ORDER BY name",
      { replacements: [`%${criteria}%`] }
    ).then(([products]) => {
      res.json(utils.queryResultToJson(products));
    }).catch((error) => {
      next(error.parent);
    });
  };
};
