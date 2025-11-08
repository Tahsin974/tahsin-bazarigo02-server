const express = require("express");
const uuidv4 = require("uuid").v4;
const cors = require("cors");
const pool = require("./db");
// const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const sanitizeHtml = require("sanitize-html");
const app = express();
const port = 3000;

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

require("dotenv").config();

async function run() {
  try {
    // Database connection and operations would go here

    //------------ Products API Routes ----------------//

    //GET: Get Products API Route
    app.get("/products", async (req, res) => {
      try {
        const query = "SELECT * FROM products;";
        const result = await pool.query(query);
        res.status(200).json({
          message: "Products route is working!",
          products: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //GET: Get Single Product API Route
    app.get("/products/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const query = "SELECT * FROM products WHERE id =$1;";
        const values = [productId];
        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Single product route is working for ID: ${productId}`,
          product: result.rows[0],
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //POST: Create Product API route

    app.post("/products", async (req, res) => {
      try {
        const {
          id,
          productName,
          "regular price": regular_price,
          "sale price": sale_price,
          discount,
          rating,
          isBestSeller,
          isHot,
          isNew,
          isTrending,
          isLimitedStock,
          isExclusive,
          isFlashSale,
          category,
          subcategory,
          description,
          stock,
          brand,
          weight,
          images,
          extras,
          createdAt,
          updatedAt,
          sellerId,
          sellerName,
          sellerStoreName,
        } = req.body;

        const sanitizedDescription = sanitizeHtml(description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ["src", "alt", "width", "height"],
          },
        });

        const productId = uuidv4();

        const savedPaths = await Promise.all(
          images.map(async (imgStr, i) => {
            // Base64 থেকে clean করা
            const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");

            const filename = `${productName}-${i}.webp`; // WebP ফাইল
            const filepath = path.join(__dirname, "uploads", filename);

            // Sharp দিয়ে লসলেস WebP এ কনভার্ট ও সংরক্ষণ
            await sharp(buffer).webp({ lossless: true }).toFile(filepath);

            return `/uploads/${filename}`;
          })
        );

        const query = `
          INSERT INTO products (
            id, product_name, regular_price, sale_price, discount, rating,
          isBestSeller, isHot, isNew, isTrending, isLimitedStock, isExclusive, isFlashSale,
          category, subcategory, description, stock, brand, weight, images, extras,
          createdAt, updatedAt, seller_id, seller_name, seller_store_name
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
            $14,$15,$16,$17,$18,$19,$20,$21,
             $22,$23,$24,$25,$26
          ) RETURNING *;
        `;

        const values = [
          productId,
          productName,
          regular_price || 0,
          sale_price || 0,
          discount || 0,
          rating || 0,
          isBestSeller || false,
          isHot || false,
          isNew || true,
          isTrending || false,
          isLimitedStock || false,
          isExclusive || false,
          isFlashSale || false,
          category || null,
          subcategory || null,
          sanitizedDescription || null,
          stock || 0,
          brand || null,
          weight || 1,
          savedPaths,
          extras || {},
          createdAt,
          updatedAt || null,
          sellerId || null,
          sellerName || null,
          sellerStoreName || "",
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
          message: "Product created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // app.post("/products/bulk", async (req, res) => {
    //   try {
    //     const products = req.body; // expect array of product objects
    //     if (!Array.isArray(products) || products.length === 0) {
    //       return res.status(400).json({ message: "No products provided" });
    //     }

    //     const insertedProducts = [];

    //     for (const item of products) {
    //       const {
    //         productName,
    //         "regular price": regular_price,
    //         "sale price": sale_price,
    //         discount,
    //         rating,
    //         isBestSeller,
    //         isHot,
    //         isNew,
    //         isTrending,
    //         isLimitedStock,
    //         isExclusive,
    //         isFlashSale,
    //         category,
    //         subcategory,
    //         description,
    //         stock,
    //         brand,
    //         weight,
    //         images,
    //         extras,
    //         createdAt,
    //         updatedAt,
    //         sellerId,
    //         sellerName,
    //         sellerStoreName,
    //       } = item;

    //       // Sanitize description
    //       const sanitizedDescription = sanitizeHtml(description || "", {
    //         allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    //         allowedAttributes: {
    //           ...sanitizeHtml.defaults.allowedAttributes,
    //           img: ["src", "alt", "width", "height"],
    //         },
    //       });

    //       // Save images to uploads folder (if base64)
    //       const savedPaths = (images || [])
    //         .map((imgStr, i) => {
    //           if (!imgStr) return null;
    //           const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
    //           const buffer = Buffer.from(base64Data, "base64");
    //           const filename = `${productName}-${uuidv4()}.jpg`;
    //           const filepath = path.join(__dirname, "uploads", filename);
    //           fs.writeFileSync(filepath, buffer);
    //           return `/uploads/${filename}`;
    //         })
    //         .filter(Boolean);

    //       const productId = uuidv4();
    //       const query = `
    //     INSERT INTO products (
    //       id, product_name, regular_price, sale_price, discount, rating,
    //       isBestSeller, isHot, isNew, isTrending, isLimitedStock, isExclusive, isFlashSale,
    //       category, subcategory, description, stock, brand, weight, images, extras,
    //       createdAt, updatedAt, sellerId, sellerName, sellerStoreName
    //     ) VALUES (
    //       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
    //       $14,$15,$16,$17,$18,$19,$20,$21,
    //       $22,$23,$24,$25,$26
    //     ) RETURNING *;
    //   `;

    //       const values = [
    //         productId,
    //         productName,
    //         regular_price || 0,
    //         sale_price || 0,
    //         discount || 0,
    //         rating || 0,
    //         isBestSeller || false,
    //         isHot || false,
    //         isNew || true,
    //         isTrending || false,
    //         isLimitedStock || false,
    //         isExclusive || false,
    //         isFlashSale || false,
    //         category || null,
    //         subcategory || null,
    //         sanitizedDescription || null,
    //         stock || 0,
    //         brand || null,
    //         weight || 1,
    //         savedPaths,
    //         extras || {},
    //         createdAt || new Date(),
    //         updatedAt || null,
    //         sellerId || null,
    //         sellerName || null,
    //         sellerStoreName || "",
    //       ];

    //       const result = await pool.query(query, values);
    //       insertedProducts.push(result.rows[0]);
    //     }

    //     res.status(201).json({
    //       message: "Bulk products created successfully",
    //       insertedCount: insertedProducts.length,
    //       products: insertedProducts,
    //     });
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: error.message });
    //   }
    // });

    //UPDATE: Update Single Product API Route
    app.post("/products/bulk", async (req, res) => {
      try {
        const products = req.body;

        if (!Array.isArray(products) || products.length === 0) {
          return res.status(400).json({ message: "No products provided" });
        }

        const insertedProducts = [];

        for (const item of products) {
          // Sanitize description
          const sanitizedDescription = sanitizeHtml(item.description || "", {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
            allowedAttributes: {
              ...sanitizeHtml.defaults.allowedAttributes,
              img: ["src", "alt", "width", "height"],
            },
          });

          // Images: detect base64 or path
          // const savedPaths = (item.images || [])
          //   .map((imgStr, i) => {
          //     if (!imgStr) return null;

          //     if (imgStr.startsWith("data:image/")) {
          //       // Base64: save file
          //       const base64Data = imgStr.replace(
          //         /^data:image\/\w+;base64,/,
          //         ""
          //       );
          //       const buffer = Buffer.from(base64Data, "base64");
          //       const safeName = item.product_name.replace(/\s+/g, "_"); // replace spaces
          //       const filename = `${safeName}-${uuidv4()}.jpg`;
          //       const uploadDir = path.join(__dirname, "uploads");
          //       if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir); // ensure folder exists
          //       const filepath = path.join(uploadDir, filename);
          //       fs.writeFileSync(filepath, buffer);
          //       return `/uploads/${filename}`;
          //     } else {
          //       // Existing path: use as is
          //       return imgStr.trim();
          //     }
          //   })
          //   .filter(Boolean);
          const savedPaths = (
            await Promise.all(
              (item.images || []).map(async (imgStr) => {
                if (!imgStr) return null;

                if (imgStr.startsWith("data:image/")) {
                  const base64Data = imgStr.replace(
                    /^data:image\/\w+;base64,/,
                    ""
                  );
                  const buffer = Buffer.from(base64Data, "base64");

                  const safeName = item.product_name.replace(/\s+/g, "_");
                  const filename = `${safeName}-${uuidv4()}.webp`;
                  const uploadDir = path.join(__dirname, "uploads");

                  if (!fs.existsSync(uploadDir))
                    fs.mkdirSync(uploadDir, { recursive: true });

                  const filepath = path.join(uploadDir, filename);

                  await sharp(buffer).webp({ lossless: true }).toFile(filepath);

                  return `/uploads/${filename}`;
                } else {
                  return imgStr.trim();
                }
              })
            )
          ).filter(Boolean);

          const query = `
        INSERT INTO products (
          id, product_name, regular_price, sale_price, discount, rating,
          isBestSeller, isHot, isNew, isTrending, isLimitedStock, isExclusive, isFlashSale,
          category, subcategory, description, stock, brand, weight, images, extras,
          createdAt, updatedAt, seller_id, seller_name, seller_store_name
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
          $14,$15,$16,$17,$18,$19,$20,$21,
          $22,$23,$24,$25,$26
        ) RETURNING *;
      `;

          const values = [
            item.id || uuidv4(),
            item.productName || "Untitled",
            item.regular_price || 0,
            item.sale_price || 0,
            item.discount || 0,
            parseFloat(item.rating) || 0,
            item.isbestseller || false,
            item.ishot || false,
            item.isnew || true,
            item.istrending || false,
            item.islimitedstock || false,
            item.isexclusive || false,
            item.isflashsale || false,
            item.category || null,
            item.subcategory || null,
            sanitizedDescription,
            item.stock || 0,
            item.brand || null,
            parseFloat(item.weight) || 1,
            savedPaths,
            item.extras || {},
            item.createdat ? new Date(item.createdat) : new Date(),
            item.updatedat ? new Date(item.updatedat) : null,
            item.sellerid || null,
            item.sellername || null,
            item.sellerstorename || "",
          ];

          const result = await pool.query(query, values);
          insertedProducts.push(result.rows[0]);
        }

        res.status(201).json({
          message: "Bulk products uploaded successfully",
          insertedCount: insertedProducts.length,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
      }
    });

    app.put("/products/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const {
          productName,
          "regular price": regular_price,
          "sale price": sale_price,
          discount,
          rating,
          isBestSeller,
          isHot,
          isNew,
          isTrending,
          isLimitedStock,
          isExclusive,
          isFlashSale,
          category,
          subcategory,
          description,
          stock,
          brand,
          images,
          extras,
          updatedAt,
        } = req.body;

        const savedPaths = [];

        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const img = images[i];

            if (img.startsWith("data:image")) {
              const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, "base64");

              const filename = `${productName}-${i}.webp`; // WebP ফাইল
              const uploadDir = path.join(__dirname, "uploads");

              if (!fs.existsSync(uploadDir))
                fs.mkdirSync(uploadDir, { recursive: true });

              const filepath = path.join(uploadDir, filename);

              try {
                await sharp(buffer).webp({ lossless: true }).toFile(filepath); // লসলেস WebP
              } catch (err) {
                console.error("Image save error:", err);
              }

              savedPaths.push(`/uploads/${filename}`);
            } else {
              // আগের ফাইলের path ব্যবহার
              savedPaths.push(img.trim());
            }
          }
        }
        const sanitizedDescription = sanitizeHtml(description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ["src", "alt", "width", "height"],
          },
        });
        // For simplicity, assuming only name and price are updated
        const query = `
          UPDATE products SET  product_name=$1, regular_price=$2, sale_price=$3, discount=$4, rating=$5,
                isBestSeller=$6, isHot=$7, isNew=$8, isTrending=$9, isLimitedStock=$10, isExclusive=$11, isFlashSale=$12,
                category=$13, subcategory=$14, description=$15, stock=$16, brand=$17, images=$18, extras=$19,
                 updatedAt=$20 WHERE id = $21;
        `;
        const values = [
          productName,
          regular_price,
          sale_price,
          discount,
          rating,
          isBestSeller,
          isHot,
          isNew,
          isTrending,
          isLimitedStock,
          isExclusive,
          isFlashSale,
          category,
          subcategory,
          sanitizedDescription,
          stock,
          brand,
          savedPaths,
          extras,
          updatedAt,
          productId,
        ];

        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Update Single product route is working for ID: ${productId}`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //DELETE: Delete Single Product API Route
    app.delete("/products/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const query = "DELETE FROM products WHERE id =$1;";
        const values = [productId];
        const result = await pool.query(query, values);
        res.status(200).json({
          message: `Delete Single product route is working for ID: ${productId}`,
          deletedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //GET: Just Arrived API Route
    app.get("/just-arrived", async (req, res) => {
      try {
        const query =
          "SELECT id,name,oldPrice,price,discount,rating,isBestSeller,isNew,images FROM products WHERE isNew AND isBestSeller;";
        const result = await pool.query(query);
        res.status(200).json({
          message: "Just Arrived route is working!",
          products: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //GET: Trending Products API Route
    app.get("/trending-products", async (req, res) => {
      try {
        const { tag } = req.query;
        let query =
          "SELECT id,name,oldPrice,price,discount,rating,isBestSeller,isNew,images FROM products WHERE 1=1";

        if (tag && tag !== "All") {
          switch (tag) {
            case "Best Seller":
              query += " AND isBestSeller = true";
              break;
            case "Hot":
              query += " AND isHot = true";
              break;
            case "Trending":
              query += " AND isTrending = true";
              break;
            case "Limited Stock":
              query += " AND isLimitedStock = true";
              break;
            case "Exclusive":
              query += " AND isExclusive = true";
              break;
          }
        }

        const result = await pool.query(query);
        return res.status(200).json({
          message: "Trending Products route is working!",
          query: query,
          products: result.rows.length,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Flash Sale Products API Routes

    //GET: Get Flash Sale Products
    app.get("/flash-sale", async (req, res) => {
      try {
        const query = "SELECT * FROM flashSaleProducts;";

        const result = await pool.query(query);
        res.status(200).json({
          message: "Flash Sale Products fetched successfully",
          products: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //POST: Create Flash Sale Products
    app.post("/flash-sale", async (req, res) => {
      try {
        const flashSaleInfo = req.body;

        const query = `
          INSERT INTO flashSaleProducts (
            isActive, duration, saleProducts
          ) VALUES (
            $1,$2,$3
          ) RETURNING *;
        `;
        const values = [
          flashSaleInfo.isActive || false,
          flashSaleInfo.duration || 0,
          JSON.stringify(flashSaleInfo.saleProducts) || [],
        ];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Flash Sale created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Products API Routes End ----------------//

    // ------------ Inventory API Routes ------------//
    // GET: Get Inventory
    app.get("/inventory", async (req, res) => {
      try {
        const query = "SELECT id,name,stock FROM products;";
        const result = await pool.query(query);
        res.status(200).json({
          message: "Return Inventory Successfully Done",
          inventory: result.rows,
        });
      } catch (error) {
        res.status(500).json({
          message: error.message,
        });
      }
    });

    // PATCH: Update Inventory  Products Stocks
    app.patch("/inventory", async (req, res) => {
      try {
        const { change, productId } = req.body; // change: +1, -1, or any number

        if (change === undefined || typeof change !== "number") {
          return res.status(400).json({ message: "Invalid change value" });
        }

        let result;

        if (productId) {
          // Update specific product
          const query = `
        UPDATE products 
        SET stock = GREATEST(stock + $1, 0) 
        WHERE id = $2
      `;
          const values = [change, productId];
          result = await pool.query(query, values);
        } else {
          // Update all products
          const query = `
        UPDATE products 
        SET stock = GREATEST(stock + $1, 0)
      `;
          const values = [change];
          result = await pool.query(query, values);
        }

        res.status(200).json({
          message: productId
            ? `Product ID ${productId} stock updated successfully`
            : `All product stocks updated successfully`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Inventory API Routes End ------------//

    // ------------ Seller API Routes ------------//
    // POST: Create Seller API Route
    app.post("/sellers", async (req, res) => {
      try {
        const sellerInfo = req.body;
        const id = uuidv4();
        sellerInfo.id = id;
        const uploadDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        // Helper function for saving base64 image to webp
        const saveBase64Image = async (imgStr, prefix) => {
          if (imgStr && imgStr.startsWith("data:image")) {
            const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const safeName =
              sellerInfo.full_name?.replace(/\s+/g, "_") || "seller";
            const filename = `${safeName}_${prefix}_${uuidv4()}.webp`;
            const filepath = path.join(uploadDir, filename);

            await sharp(buffer).webp({ lossless: true }).toFile(filepath);
            return `/uploads/${filename}`;
          }
          return null;
        };

        // তিনটি ইমেজ প্রসেস করা
        const profileImgPath = await saveBase64Image(sellerInfo.img, "profile");
        const nidFrontPath = await saveBase64Image(
          sellerInfo.nidFrontImg,
          "nid_front"
        );
        const nidBackPath = await saveBase64Image(
          sellerInfo.nidBackImg,
          "nid_back"
        );

        const query =
          "INSERT INTO sellers (id,email,password,full_name,phone_number,img,nid_number,store_name,product_category,business_address,district,thana,postal_code,trade_license_number,nid_front_file,nid_back_file,bank_name,branch_name,account_number,account_holder_name,routing_number,mobile_bank_name,mobile_bank_account_number,created_at,updated_at,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING *;";
        const values = [
          sellerInfo.id,
          sellerInfo.email || null,
          sellerInfo.password || null,
          sellerInfo.full_Name || null,
          sellerInfo.phone_number || null,
          profileImgPath || null,
          sellerInfo.nidNumber || null,
          sellerInfo.storeName || null,
          sellerInfo.product_category || null,
          sellerInfo.businessAddress || null,
          sellerInfo.district || null,
          sellerInfo.thana || null,
          sellerInfo.postal_code || null,
          sellerInfo.tradeLicenseNumber || null,
          nidFrontPath || null,
          nidBackPath || null,
          sellerInfo.bankName || null,
          sellerInfo.branchName || null,
          sellerInfo.accountNumber || null,
          sellerInfo.accountHolderName || null,
          sellerInfo.routingNumber || null,
          sellerInfo.mobile_bank_name || null,
          sellerInfo.mobileBankAccountNumber || null,
          sellerInfo.created_at || null,
          sellerInfo.updated_at || null,
          "pending",
        ];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Seller created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
    // UPDATE: Update Seller API Route
    app.put("/sellers/:id", async (req, res) => {
      try {
        const sellerId = req.params.id;
        const updatedInfo = req.body;

        const uploadDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        // Helper function for saving base64 image to webp
        const saveBase64Image = async (imgStr, prefix) => {
          if (imgStr && imgStr.startsWith("data:image")) {
            const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const safeName =
              updatedInfo.full_name?.replace(/\s+/g, "_") || "seller";
            const filename = `${safeName}_${prefix}_${uuidv4()}.webp`;
            const filepath = path.join(uploadDir, filename);

            await sharp(buffer).webp({ lossless: true }).toFile(filepath);
            return `/uploads/${filename}`;
          }
          return imgStr || null; // base64 না হলে পুরনো path থাকবে
        };

        // তিনটি ইমেজ প্রসেস করা
        const profileImgPath = await saveBase64Image(
          updatedInfo.img,
          "profile"
        );
        const nidFrontPath = await saveBase64Image(
          updatedInfo.nidFrontImg,
          "nid_front"
        );
        const nidBackPath = await saveBase64Image(
          updatedInfo.nidBackImg,
          "nid_back"
        );

        const query = `
      UPDATE sellers SET 
        email=$1,
        password=$2,
        full_name=$3,
        phone_number=$4,
        img=$5,
        nid_number=$6,
        store_name=$7,
        product_category=$8,
        business_address=$9,
        district=$10,
        thana=$11,
        postal_code=$12,
        trade_license_number=$13,
        nid_front_file=$14,
        nid_back_file=$15,
        bank_name=$16,
        branch_name=$17,
        account_number=$18,
        account_holder_name=$19,
        routing_number=$20,
        mobile_bank_name=$21,
        mobile_bank_account_number=$22,
        updated_at=$23
      WHERE id=$24
      RETURNING *;
    `;

        const values = [
          updatedInfo.email || null,
          updatedInfo.password || null,
          updatedInfo.full_name || null,
          updatedInfo.phone_number || null,
          profileImgPath || null,
          updatedInfo.nid_number || null,
          updatedInfo.store_name || null,
          updatedInfo.product_category || null,
          updatedInfo.business_address || null,
          updatedInfo.district || null,
          updatedInfo.thana || null,
          updatedInfo.postal_code || null,
          updatedInfo.trade_license_number || null,
          nidFrontPath || null,
          nidBackPath || null,
          updatedInfo.bank_name || null,
          updatedInfo.branch_name || null,
          updatedInfo.account_number || null,
          updatedInfo.account_holder_name || null,
          updatedInfo.routing_number || null,
          updatedInfo.mobile_bank_name || null,
          updatedInfo.mobile_bank_account_number || null,
          updatedInfo.updated_at || new Date(),
          sellerId,
        ];
        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Update Seller route is working for ID: ${sellerId}`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Update Seller Role API Route
    app.patch("/sellers/:id/status", async (req, res) => {
      try {
        const sellerId = req.params.id;
        const { role: status } = req.body;
        const query = "UPDATE sellers SET status=$1 WHERE id = $2;";
        const values = [status, sellerId];
        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Seller status updated successfully for ID: ${sellerId}`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: Get Sellers API Route
    app.get("/sellers", async (req, res) => {
      try {
        const query = "SELECT * FROM sellers;";
        const result = await pool.query(query);
        res.status(200).json({
          message: "Sellers route is working!",
          sellers: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
    // GET: Get Seller By Id API Route
    app.get("/sellers/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = "SELECT * FROM sellers WHERE id=$1;";
        const result = await pool.query(query, [id]);
        res.status(200).json({
          message: "Sellers route is working!",
          seller: result.rows[0],
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
    // Delete: Delete Seller By Id API Route
    app.delete("/sellers/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = "DELETE FROM sellers WHERE id = $1;";
        const result = await pool.query(query, [id]);
        res.status(200).json({
          message: "Sellers Delete route is working!",
          deletedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Seller API Routes End ----------------//

    // ------------ Users API Routes ----------------//

    // POST: Create Users API Route
    app.post("/users", async (req, res) => {
      try {
        const userInfo = req.body;
        const id = uuidv4();
        userInfo.id = id;

        const imgStr = userInfo.img; // single base64 image string

        let savedPath = null;

        if (imgStr && imgStr.startsWith("data:image")) {
          const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          const safeName = userInfo.name.replace(/\s+/g, "_"); // নিরাপদ নাম
          const filename = `${safeName}.webp`;
          const uploadDir = path.join(__dirname, "uploads");

          // uploads ফোল্ডার তৈরি করো যদি না থাকে
          if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });

          const filepath = path.join(uploadDir, filename);

          // Sharp দিয়ে WebP ফরম্যাটে কনভার্ট ও সেভ
          await sharp(buffer)
            .webp({ lossless: true }) // সর্বোচ্চ মানে
            .toFile(filepath);

          savedPath = `/uploads/${filename}`;
        }

        const query =
          "INSERT INTO users (id,name,user_name,email,img,phone,password,address,district,thana,postal_code,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *;";
        const values = [
          userInfo.id,
          userInfo.name,
          userInfo.user_name,
          userInfo.email,
          savedPath || null,
          userInfo.phone || null,
          userInfo.password,
          userInfo.address || null,
          userInfo.district || null,
          userInfo.thana || null,
          userInfo.postal_code || null,
          userInfo.created_at,
          userInfo.updated_at || null,
        ];

        console.log(values);
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "User created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        // Unique constraint violation
        if (error.code === "23505") {
          if (error.detail.includes("user_name")) {
            return res.status(400).json({ error: "user_name already exist" });
          }
          if (error.detail.includes("email")) {
            return res.status(400).json({ error: "email already exist" });
          }
        }

        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // UPDATE: Update Users API Route
    app.put("/users/:id", async (req, res) => {
      try {
        const userId = req.params.id;
        const updatedInfo = req.body;
        let savedPath = updatedInfo?.img;

        // যদি নতুন base64 ইমেজ পাঠানো হয়
        if (updatedInfo.img && updatedInfo.img.startsWith("data:image")) {
          const base64Data = updatedInfo.img.replace(
            /^data:image\/\w+;base64,/,
            ""
          );
          const buffer = Buffer.from(base64Data, "base64");

          const safeName = updatedInfo.name.replace(/\s+/g, "_");
          const filename = `${safeName}_${userId}.webp`;
          const uploadDir = path.join(__dirname, "uploads");

          if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });

          const filepath = path.join(uploadDir, filename);

          // 🔹 যদি আগের ইমেজ থাকে, সেটি ডিলিট করো
          if (savedPath && savedPath.startsWith("/uploads/")) {
            const oldPath = path.join(__dirname, savedPath);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }

          // নতুন ইমেজ WebP আকারে সেভ করো
          await sharp(buffer).webp({ lossless: true }).toFile(filepath);

          savedPath = `/uploads/${filename}`;
        }
        const query = `
      UPDATE users SET name=$1,user_name=$2,email=$3,img=$4,phone=$5, password=$6,address=$7,district=$8,thana=$9,postal_code=$10,updated_at=$11 WHERE id = $12;
    `;
        const values = [
          updatedInfo.name,
          updatedInfo.user_name,
          updatedInfo.email,
          savedPath || null,
          updatedInfo.phone || null,
          updatedInfo.password,
          updatedInfo.address || null,
          updatedInfo.district || null,
          updatedInfo.thana || null,
          updatedInfo.postal_code || null,
          updatedInfo.updated_at || null,
          userId,
        ];
        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Update User route is working for ID: ${userId}`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: Get Users API Route
    app.get("/users", async (req, res) => {
      try {
        const query = "SELECT * FROM users;";
        const result = await pool.query(query);
        res.status(200).json({
          message: "Users route is working!",
          users: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Users API Routes End ----------------//

    // ------------ Wishlist API Routes ----------------//

    // POST: Create Wishlist API Route
    app.post("/wishlist", async (req, res) => {
      try {
        const { email, productId, productName, price, img } = req.body;

        const checkQuery =
          "SELECT * FROM wishlist WHERE user_email=$1 AND productId=$2";
        const checkResult = await pool.query(checkQuery, [email, productId]);

        if (checkResult.rows.length === 0) {
          const wishlistId = uuidv4();
          const insertQuery =
            "INSERT INTO wishlist (wishlistId, user_email, productId, productName, price, img) VALUES ($1,$2,$3,$4,$5,$6)";
          const values = [
            wishlistId,
            email,
            productId,
            productName,
            price,
            img,
          ];
          const createResult = await pool.query(insertQuery, values);

          return res.status(201).json({
            message: "Wishlist Item Added!",
            createdCount: createResult.rowCount,
          });
        } else {
          const deleteQuery =
            "DELETE FROM wishlist WHERE user_email=$1 AND productId=$2";
          const deleteResult = await pool.query(deleteQuery, [
            email,
            productId,
          ]);
          return res.status(200).json({ deletedCount: deleteResult.rowCount });
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: GET WishlistItems By Email API Route
    app.get("/wishlist", async (req, res) => {
      try {
        const { email, id } = req.query;
        if (id === undefined) {
          const query = "SELECT * FROM wishlist WHERE user_email=$1;";
          const result = await pool.query(query, [email]);

          return res.status(200).json({
            message: "Wishlist route is working!",
            wishlists: result.rows,
          });
        }
        const query =
          "SELECT * FROM wishlist WHERE user_email=$1 AND productId=$2;";
        const result = await pool.query(query, [email, id]);

        return res.status(200).json({
          message: "Check Is In Wishlist !",
          isInWishlist: result.rows.length > 0,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Wishlist API Routes End -------------//

    // ------------ Cart API Routes ----------------//

    // POST: Create Cart API Route
    app.post("/carts", async (req, res) => {
      try {
        const { email } = req.query;
        const cartId = uuidv4();
        const { sellerId, productInfo, deliveries } = req.body;

        const existingQuery =
          "SELECT * FROM carts WHERE user_email=$1 AND sellerId=$2";

        const existingCartResult = await pool.query(existingQuery, [
          email,
          sellerId,
        ]);

        if (existingCartResult.rowCount > 0) {
          const existingCart = existingCartResult.rows[0];

          // ✅ define existingProducts properly
          const existingProducts = existingCart.productinfo;
          const existingProductIds = existingProducts.map((p) => p.product_Id);

          const newProducts = productInfo.filter(
            (p) => !existingProductIds.includes(p.product_Id)
          );

          if (newProducts.length === 0) {
            return res
              .status(200)
              .json({ message: "Product already in cart!" });
          }

          const updatedCart = [...existingProducts, ...newProducts];
          const updateCartQuery = `
        UPDATE carts
        SET productInfo = $1
        WHERE cartId = $2
      `;
          const updateCartResult = await pool.query(updateCartQuery, [
            JSON.stringify(updatedCart),
            existingCart.cartid,
          ]);

          res.status(200).json({
            message: "Cart updated successfully!",
            updatedCount: updateCartResult.rowCount,
          });
        } else {
          const insertCartQuery = `
        INSERT INTO carts (cartId,user_email,sellerId,productInfo,deliveries)
        VALUES ($1,$2,$3,$4,$5);
      `;
          const insertCartQueryValues = [
            cartId,
            email,
            sellerId,
            JSON.stringify(productInfo),
            deliveries,
          ];
          const insertCartResult = await pool.query(
            insertCartQuery,
            insertCartQueryValues
          );

          res.status(201).json({
            message: "Cart created successfully!",
            createdCount: insertCartResult.rowCount,
          });
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: GET CartItems By Email API Route
    app.get("/carts", async (req, res) => {
      try {
        const { email } = req.query;
        const query = `SELECT c.*, s.full_name AS seller_name,s.store_name AS seller_store_name
      FROM carts c
      LEFT JOIN sellers s ON c.sellerid = s.id
      WHERE c.user_email = $1;`;
        const result = await pool.query(query, [email]);

        res.status(200).json({
          message: "Carts route is working!",
          carts: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // PATCH Add deliveries
    app.patch("/carts", async (req, res) => {
      try {
        const { deliveries, cartId } = req.body;

        const query =
          "UPDATE carts SET deliveries = $1 WHERE cartid = $2 RETURNING *";
        const values = [JSON.stringify(deliveries), cartId];
        const updateResult = await pool.query(query, values);

        res.status(200).json({
          message: "Quantity updated successfully!",
          updatedCount: updateResult.rowCount,
        });
      } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ message: error.message });
      }
    });

    // ✅ PATCH route for updating quantity inside JSONB productInfo
    app.patch("/carts/update-qty", async (req, res) => {
      try {
        const { cartId, productId, newQty } = req.body;

        if (!cartId || !productId || typeof newQty !== "number" || newQty < 1) {
          return res.status(400).json({ message: "Invalid data" });
        }

        // Step 1: Get current cart data
        const selectQuery = "SELECT productinfo FROM carts WHERE cartid = $1";
        const cartResult = await pool.query(selectQuery, [cartId]);

        if (cartResult.rowCount === 0) {
          return res.status(404).json({ message: "Cart not found" });
        }

        const productInfo = cartResult.rows[0].productinfo;

        // Step 2: Update qty inside JSON in JS
        const updatedInfo = productInfo.map((item) =>
          item.product_Id === productId ? { ...item, qty: newQty } : item
        );

        // Step 3: Save updated JSON back to DB
        const updateQuery =
          "UPDATE carts SET productinfo = $1 WHERE cartid = $2 RETURNING *";
        const updateResult = await pool.query(updateQuery, [
          JSON.stringify(updatedInfo),
          cartId,
        ]);

        res.status(200).json({
          message: "Quantity updated successfully!",
          updatedCount: updateResult.rowCount,
        });
      } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ message: error.message });
      }
    });

    app.patch("/carts/remove-product", async (req, res) => {
      try {
        const { cartId, productId } = req.body;

        if (!cartId || !productId) {
          return res.status(400).json({ message: "Invalid data" });
        }

        // Step 1: Fetch current cart
        const selectQuery = "SELECT * FROM carts WHERE cartid = $1";
        const cartResult = await pool.query(selectQuery, [cartId]);

        if (cartResult.rowCount === 0) {
          return res.status(404).json({ message: "Cart not found" });
        }

        const cart = cartResult.rows[0];
        const productInfo = cart.productinfo;

        // Step 2: Filter out the product to remove
        const updatedInfo = productInfo.filter(
          (item) => item.product_Id !== productId
        );

        // Step 3: যদি সব প্রোডাক্ট বাদ পড়ে যায় → পুরো cart মুছে ফেল
        if (updatedInfo.length === 0) {
          const deleteQuery = "DELETE FROM carts WHERE cartid = $1";
          const deletedResult = await pool.query(deleteQuery, [cartId]);
          return res.status(200).json({
            message: "Product removed and cart deleted (empty now).",
            deletedCount: deletedResult.rowCount,
          });
        }

        // Step 4: অন্যথায় শুধু আপডেট করো
        const updateQuery =
          "UPDATE carts SET productinfo = $1 WHERE cartid = $2 RETURNING *";
        const updateResult = await pool.query(updateQuery, [
          JSON.stringify(updatedInfo),
          cartId,
        ]);

        res.status(200).json({
          message: "Product removed successfully!",

          deletedCount: updateResult.rowCount,
        });
      } catch (error) {
        console.error("Error removing product:", error);
        res.status(500).json({ message: error.message });
      }
    });

    app.delete("/carts", async (req, res) => {
      try {
        const { ids } = req.body; // ডিলিট করার product IDs
        if (!ids || !ids.length) {
          return res.status(400).json({ message: "No IDs provided" });
        }

        // সব কার্ট খুঁজে বের করা
        const cartsResult = await pool.query("SELECT * FROM carts");
        const carts = cartsResult.rows;

        // প্রতিটা কার্টে productinfo আপডেট করা
        for (let cart of carts) {
          let updatedProducts = cart.productinfo.filter(
            (p) => !ids.includes(p.product_Id)
          );

          if (updatedProducts.length === 0) {
            const deleteResult = await pool.query(
              "DELETE FROM carts WHERE cartid = $1",
              [cart.cartid]
            );
            res.status(200).json({
              message: "Products deleted successfully",
              deletedCount: deleteResult.rowCount,
            });
          } else {
            const updatedResult = await pool.query(
              "UPDATE carts SET productinfo = $1 WHERE cartid = $2",
              [JSON.stringify(updatedProducts), cart.cartid]
            );
            res.status(200).json({
              message: "Products deleted successfully",
              updatedCount: updatedResult.rowCount,
            });
          }
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Cart API Routes End----------------//

    // ------------ Zone API Routes ----------------//

    // POST: Create Zone API Route
    app.post("/zones", async (req, res) => {
      try {
        const zoneInfo = req.body;
        const query =
          "INSERT INTO zones (name,delivery_time,delivery_charge) VALUES ($1,$2,$3) RETURNING *;";
        const values = [
          zoneInfo.name,
          zoneInfo.delivery_time,
          zoneInfo.delivery_charge,
        ];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Zone created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: Get Zones API Route
    app.get("/zones", async (req, res) => {
      try {
        const query = "SELECT * FROM zones;";
        const result = await pool.query(query);
        res.status(200).json({
          message: "Zones route is working!",
          zones: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // POST: Create Postal Zone API Route
    app.post("/postal-zones", async (req, res) => {
      try {
        const postalZoneInfo = req.body;

        const query = `
      INSERT INTO postal_zones
        (postal_code, division, district, thana, latitude, longitude, is_remote)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

        const values = [
          postalZoneInfo.postal_code,
          postalZoneInfo.division,
          postalZoneInfo.district,
          postalZoneInfo.thana,
          postalZoneInfo.latitude,
          postalZoneInfo.longitude,
          postalZoneInfo.is_remote || false, // default false if not provided
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
          message: "Postal Zone created successfully",
          createdCount: result.rowCount,
          postalZone: result.rows[0],
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: Get Postal Zones API Route
    app.get("/postal-zones", async (req, res) => {
      try {
        const query = `SELECT *
FROM postal_zones
ORDER BY
  TRIM(division) ASC,
  TRIM(district) ASC,
  TRIM(thana) ASC;
`;
        const result = await pool.query(query);
        res.status(200).json({
          message: "Postal Zones route is working!",
          postal_zones: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Zone API Routes End ----------------//

    // ------------ Delivery API Routes ----------------//
    // GET: Get Deliveries API Route
    app.get("/deliveries", async (req, res) => {
      const {
        sellerId,
        userId,
        weight: weightStr,
        orderAmount: orderAmountStr,
        isCod,
      } = req.query;
      const weight = parseInt(weightStr, 10) || 0;
      const orderAmount = parseInt(orderAmountStr, 10) || 0;

      // 🧩 Validation (deliveryType removed)
      if (!sellerId || !userId || !weight || !orderAmount) {
        return res.status(400).json({
          error: "sellerId, userId, weight, and orderAmount are required",
        });
      }

      try {
        const query = `
WITH seller_postal AS ( SELECT district AS s_district, AVG(latitude) AS s_lat, AVG(longitude) AS s_lon FROM postal_zones WHERE postal_code = ( SELECT postal_code FROM sellers WHERE id = $1 ) GROUP BY district ), customer_postal AS ( SELECT district AS c_district, AVG(latitude) AS c_lat, AVG(longitude) AS c_lon, MAX(is_remote::int) AS is_remote FROM postal_zones WHERE postal_code = ( SELECT postal_code FROM users WHERE id = $2 ) GROUP BY district ), distance_calc AS ( SELECT *, 6371 * 2 * ASIN(SQRT( POWER(SIN(RADIANS((c_lat - s_lat)/2)),2) + COS(RADIANS(s_lat)) * COS(RADIANS(c_lat)) * POWER(SIN(RADIANS((c_lon - s_lon)/2)),2) )) AS distance_km FROM seller_postal sp CROSS JOIN customer_postal cp ), zone_calc AS ( SELECT CASE WHEN is_remote = 1 THEN 'Remote Area' WHEN distance_km <= 20 THEN 'Inside Area' WHEN distance_km <= 50 THEN 'Near Area' ELSE 'Outside Area' END AS zone_name, distance_km FROM distance_calc ) SELECT zc.zone_name, z.delivery_time, CAST( CASE WHEN ($4 * 1.01) >= COALESCE(z.free_delivery_min_amount, 999999) THEN 0 ELSE GREATEST( CASE WHEN zc.zone_name = 'Inside Area' THEN 70 WHEN zc.zone_name = 'Near Area' THEN 100 WHEN zc.zone_name = 'Outside Area' THEN 120 WHEN zc.zone_name = 'Remote Area' THEN 200 ELSE 0 END, ( z.delivery_charge + (GREATEST(COALESCE(NULLIF($3, '')::numeric, 1), 0) * 10) + CASE WHEN $5 = 'true' THEN GREATEST(10, $4 * 0.01) ELSE 0 END ) ) END AS INTEGER) AS total_delivery_charge FROM zone_calc zc LEFT JOIN zones z ON z.name = zc.zone_name;
`;

        const result = await pool.query(query, [
          sellerId, // $1
          userId, // $2
          weight, // $3
          orderAmount, // $4
          isCod, // $5
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "No zone found" });
        }

        console.log(result.rows);

        return res.status(200).json({
          result: result.rows,
        });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

    // ------------ Delivery API Routes End ----------------//

    // ------------ Orders API Routes ----------------//

    // POST: Create Order API Route
    app.post("/orders", async (req, res) => {
      try {
        const orderInfo = req.body;
        const id = uuidv4();
        orderInfo.id = id;
        const query =
          "INSERT INTO orders (orderId,order_number,order_date,payment_method,order_status,estimated_delivery_date,customer_name,customer_email,customer_phone,customer_address,order_items,subtotal,delivery_cost,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *;";
        const values = [
          orderInfo.orderId,
          orderInfo.orderNumber,
          orderInfo.orderDate,
          orderInfo.paymentMethod,
          orderInfo.orderStatus,
          orderInfo.estimatedDeliveryDate,
          orderInfo.customerName,
          orderInfo.customerEmail,
          orderInfo.customerPhone,
          orderInfo.customerAddress,
          orderInfo.orderItems,
          orderInfo.subTotal,
          orderInfo.deliveryCharge,
          orderInfo.total,
        ];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Order created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: GET Orders By Email API Route
    app.get("/orders", async (req, res) => {
      try {
        const { email } = req.query;
        const query = "SELECT * FROM orders WHERE customer_email=$1;";
        const values = [email];
        const result = await pool.query(query, values);
        res.status(200).json({
          message: "orders route is working!",
          orders: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // POST: Create Return Order API Route
    app.post("/return-orders", async (req, res) => {
      try {
        const { orderId, reason, img } = req.body;
        const id = uuidv4();
        orderInfo.id = id;
        const query =
          "INSERT INTO return_orders (id,orderId,reason,img) VALUES ($1,$2,$3,$4) RETURNING *;";
        const values = [id, orderId, reason, img || null];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Return Order created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: Get Return Order API Route
    app.get("/return-orders", async (req, res) => {
      try {
        const id = uuidv4();
        orderInfo.id = id;
        const query = "SELECT * FROM return_orders;";

        const result = await pool.query(query);
        res.status(200).json({
          message: "Return Order route working successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Orders API Routes End ----------------//

    // ------------ Payments API Routes ----------------//

    // POST: Create Payment API Route
    app.post("/payments", async (req, res) => {
      try {
        const {
          payment_date,
          amount,
          payment_method,
          transactionId,
          phoneNumber,
          isCashOnDelivery,
        } = req.body;
        if (!amount || !payment_method) {
          return res
            .status(400)
            .json({ message: "Amount and payment method are required" });
        }
        const id = uuidv4();
        const query =
          "INSERT INTO payments (id,transactionId,payment_date,amount,payment_method,status,isCashOnDelivery,phone_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *;";
        const values = [
          id,
          transactionId,
          payment_date,
          amount,
          payment_method,
          "pending",
          isCashOnDelivery,
          phoneNumber,
        ];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Payment created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: GET Payments API Route
    app.get("/payments", async (req, res) => {
      try {
        const query = "SELECT * FROM payments ;";

        const result = await pool.query(query);
        res.status(200).json({
          message: "Payment return successfully",
          payments: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // PATCH: Update Payment status API Route
    app.patch("/payments/:id", async (req, res) => {
      try {
        const paymentId = req.params.id;
        const { status } = req.body;
        const query = "UPDATE payments SET status=$1 WHERE transactionId = $2;";
        const values = [status, paymentId];
        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Payment status updated successfully for ID: ${paymentId}`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Payments API Routes End----------------//

    // ------------ Promotions API Routes------------//

    // POST: Create Promotions API Route
    app.post("/promotions", async (req, res) => {
      try {
        const { code, discount, start_date, end_date } = req.body;
        const id = uuidv4();
        const query =
          "INSERT INTO promotions (id,code, discount, start_date, end_date,is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;";
        const values = [id, code, discount, start_date, end_date, false];
        const result = await pool.query(query, values);
        res.status(201).json({
          message: "Promotion created successfully",
          createdCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // GET: GET Promotions API Route
    app.get("/promotions", async (req, res) => {
      try {
        const query = "SELECT * FROM promotions ;";

        const result = await pool.query(query);
        res.status(200).json({
          message: "Promotions return successfully",
          promotions: result.rows,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // PATCH: Update Payment status API Route
    app.patch("/promotions/:id", async (req, res) => {
      try {
        const promotionId = req.params.id;
        const { is_active } = req.body;
        const query = "UPDATE promotions SET is_active=$1 WHERE id = $2;";
        const values = [is_active, promotionId];
        const result = await pool.query(query, values);

        res.status(200).json({
          message: `Promotions status updated successfully for ID: ${promotionId}`,
          updatedCount: result.rowCount,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // ------------ Promotions API Routes End---------//
  } finally {
    // Ensures that the client will close when you finish/error
    // await pool.end();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Welcome to Bazarigo Server!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
