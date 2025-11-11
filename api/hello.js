module.exports = (req, res) => {
  try {
    res.status(200).json({ ok: true, hello: "world" });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
};

module.exports.config = {
  runtime: "nodejs20.x",
};
