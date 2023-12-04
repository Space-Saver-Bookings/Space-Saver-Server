// Import the configured items from the server file:
var { app, PORT, HOST } = require("./server");

// Run the server
app.listen(PORT, HOST, () => {
    console.log(`Server is running!`);
});
