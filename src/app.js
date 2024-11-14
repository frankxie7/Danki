import express from 'express';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get('/deck', (req, res) => {
  res.send("Server is working!");
  // gets all the cards in a deck
});

app.post('/deck/:id', (req, res) => {
  const body = req.body
res.send("This is a POST request");
  // adds a card to a deck of id 'id'
});


app.put('/card/:id', (req, res) => {
  const body = req.body;
  const username = req.body.username;
  res.send('This is a PUT request');
  // changes card id:
});

app.delete('/card/:id', (req, res) => {
  res.send('This is a delete request for id ${req.params.id}');
  // deletes card id:
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
