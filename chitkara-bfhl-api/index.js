const express = require('express');
const cors = require('cors');
const { processHierarchies } = require('./parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: "Invalid input format. 'data' must be an array." });
        }

        const responseData = {
            "user_id": "Abhinav Singh", 
            "email_id": "abhinav0262.be23@chitkara.edu.in",
            "college_roll_number": "2310990262",
            ...processHierarchies(data)
        };

        return res.status(200).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});