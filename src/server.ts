import express, { Request, Response } from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

const app = express();
dotenv.config();
app.use(bodyParser.json());
app.use(cookieParser())

const PORT = process.env.PORT || 3000;
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "qwerty12345",
    database: process.env.DB_NAME || "boa_db_test",
})

db.connect(err => {
    if (err) {
        console.error("Error connecting to database", err);
    } else{
        console.log("Connected to database");
    }
})

interface CartItem{
    id:string;
    title: string;
    selected: boolean;
}

app.use(cors({
    origin: "https://courier-quality-ing-innovations.trycloudflare.com/",
    credentials: true
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://courier-quality-ing-innovations.trycloudflare.com/");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.post("/api/auth", (req, res) => {
    res.cookie("shopifyOAuth", "some-token", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.json({ message: "OAuth cookie set!" });
});

app.post("/api/cart/save", async (req: Request, res: Response) => {
    const {customerId, selectedProducts} : {customerId:string; selectedProducts:CartItem[]} = req.body;

    db.query("DELETE FROM customer_cart WHERE customer_id = ?", [customerId], err => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error deleting old cart items.");
        }

        if (selectedProducts.length === 0) {
            return res.send("Cart cleared.");
        }

        const values = selectedProducts.map(product => [customerId, product.id, product.title, product.selected ? 1 : 0]);

        const sql = "INSERT INTO customer_cart (customer_id, product_id, product_title, is_selected) VALUES ?";
        db.query(sql, [values], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error saving cart.");
            }
            res.send("Cart saved successfully.");
        });
    });
});
app.get("/api/cart/load", (req: Request, res: Response) => {
    const { customerId } = req.query as { customerId: string };

    db.query("SELECT product_id, product_title, is_selected FROM customer_cart WHERE customer_id = ?", [customerId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error loading cart.");
        }

        const rows = results as any[];

        const formattedResults: CartItem[] = rows.map((row: any) => ({
            id: row.product_id,
            title: row.product_title,
            selected: Boolean(row.is_selected),
        }));

        res.json(formattedResults);
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});