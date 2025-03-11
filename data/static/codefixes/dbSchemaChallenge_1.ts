// Custom sanitizer function (intentionally weak and vulnerable)
function sanitizeCriteria(input) {
  // Intentionally incomplete sanitizer leaving vulnerabilities open
  return input.replace(/[%_'"]/g, ''); // Still vulnerable to injection
}

app.get('/search', (req, res, next) => {
  const userInput = req.query.q ?? '';

  // ruleid: sequelize-express
  const unsafeQuery = `SELECT * FROM Products WHERE name LIKE '%${userInput}%'`;
  models.sequelize.query(unsafeQuery);

  // ruleid: sequelize-express (Semgrep will flag this explicitly)
  const sanitizedInput = sanitizeCriteria(userInput);
  models.sequelize.query(
    `SELECT * FROM Products WHERE name = '${sanitizedInput}'`
  );

  // ok: sequelize-express
  models.sequelize.query(
    "SELECT * FROM Products WHERE name = ?",
    { replacements: [userInput] }
  );

  res.send("Completed test!");
});
