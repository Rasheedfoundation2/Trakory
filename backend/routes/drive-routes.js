// // const express = require('express');
// // const multer = require('multer');
// // const path = require('path');
// // const db = require('../config/db');
// // const fs = require('fs'); 
// // const router = express.Router();


// // // +++ CREATE UPLOADS DIRECTORY IF NOT EXISTS +++
// // const uploadDir = path.join(__dirname, '..', 'drive-uploads');
// // if (!fs.existsSync(uploadDir)) {
// //   fs.mkdirSync(uploadDir, { recursive: true });
// // }   

// // // Configure storage
// // const storage = multer.diskStorage({
// //     destination: (req, file, cb) => {
// //         cb(null, uploadDir);  // Changed to use absolute path
// //     },
// //     filename: (req, file, cb) => {
// //         cb(null, Date.now() + '-' + file.originalname);
// //     }
// // });

// // const upload = multer({ storage });

// // // Upload file endpoint
// // router.post('/upload', upload.single('file'), (req, res) => {
// //   try {
// //     const { userId, parentId } = req.body;
// //     const file = req.file;

// //     if (!file) {
// //         return res.status(400).json({ error: 'No file uploaded' });
// //     }

// //     const sql = `INSERT INTO Drive_Files 
// //         (name, path, size, type, user_id, parent_id, created_at, updated_at) 
// //         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;  // Added timestamps
    
// //     const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
// //     db.query(sql, [
// //         file.originalname,
// //         file.path,
// //         fileSize,
// //         file.mimetype,
// //         userId,
// //         parentId || null
// //     ], (err, result) => {
// //         if (err) {
// //             console.error('Database error:', err);
// //             return res.status(500).json({ error: 'Database error' });
// //         }
// //         res.status(200).json({ 
// //             message: 'File uploaded successfully',
// //             fileId: result.insertId,
// //             name: file.originalname,
// //             path: file.path,
// //             size: fileSize,
// //             type: file.mimetype
// //         });
// //     });
// //   } catch (error) {
// //     console.error('Upload error:', error);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });

// // // Get files endpoint
// // router.get('/files', (req, res) => {
// //     const { userId, parentId } = req.query;
    
// //     let sql = `SELECT * FROM Drive_Files WHERE user_id = ?`;
// //     const params = [userId];
    
// //     if (parentId) {
// //         sql += ` AND parent_id = ?`;
// //         params.push(parentId);
// //     } else {
// //         sql += ` AND parent_id IS NULL`;
// //     }

// //     db.query(sql, params, (err, results) => {
// //         if (err) return res.status(500).json({ error: 'Database error' });
// //         res.json(results);
// //     });
// // });

// // module.exports = router;

// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const db = require('../config/db');
// const fs = require('fs');
// const router = express.Router();

// // Configure storage
// const uploadDir = path.join(__dirname, '..', 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage });

// // Upload file endpoint
// router.post('/upload', upload.single('file'), (req, res) => {
//   try {
//     const { userId, parentId } = req.body;
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const sql = `INSERT INTO drive_files 
//       (name, path, size, type, item_type, user_id, parent_id) 
//       VALUES (?, ?, ?, ?, 'file', ?, ?)`;
    
//     const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
//     db.query(sql, [
//       file.originalname,
//       file.path,
//       fileSize,
//       file.mimetype,
//       userId,
//       parentId || null
//     ], (err, result) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error' });
//       }
//       res.status(200).json({ 
//         message: 'File uploaded successfully',
//         fileId: result.insertId
//       });
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get files endpoint
// router.get('/files', (req, res) => {
//   const { userId, parentId } = req.query;

  
//  let sql = `SELECT * FROM drive_files WHERE user_id = ?`;
// const params = [userId];
  
//   if (parentId) {
//     sql += ` AND parent_id = ?`;
//     params.push(parentId);
//   } else {
//     sql += ` AND parent_id IS NULL`;
//   }

//   db.query(sql, params, (err, results) => {
//     if (err) return res.status(500).json({ error: 'Database error' });
//     res.json(results);
//   });
// });

// // Delete file (move to recycle bin)
// // Delete file (move to recycle bin)
// router.delete('/drive_files/:id', (req, res) => {
//   const { id } = req.params;
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ error: 'Authorization token missing' });
//   }

//   const getFileSql = 'SELECT * FROM drive_files WHERE id = ?';
//   db.query(getFileSql, [id], (err, results) => {
//     if (err) return res.status(500).json({ error: 'Database error' });
//     if (results.length === 0) return res.status(404).json({ error: 'File not found' });

//     const file = results[0];

//     db.beginTransaction(err => {
//       if (err) return res.status(500).json({ error: 'Transaction error' });

//       // 1. Insert into recycle_bin
//       const insertSql = 'INSERT INTO recycle_bin (file_id, user_id, original_path, date_deleted) VALUES (?, ?, ?, NOW())';
//       db.query(insertSql, [id, file.user_id, file.path || ''], (err) => {
//         if (err) {
//           return db.rollback(() => {
//             res.status(500).json({ error: 'Recycle bin insert error' });
//           });
//         }

//         // 2. Commit (leave file in drive_files table)
//         db.commit(err => {
//           if (err) {
//             return db.rollback(() => {
//               res.status(500).json({ error: 'Commit error' });
//             });
//           }
//           res.json({ message: 'File moved to recycle bin' });
//         });
//       });
//     });
//   });
// });


// // Get recycle bin items
// // Get recycle bin items - fix the SQL query
// // Get recycle bin items
// router.get('/recycle_bin', (req, res) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   const userId = req.query.userId; // Get userId from query params
  
//   if (!token) {
//     return res.status(401).json({ error: 'Authorization token missing' });
//   }

//   const sql = `
//     SELECT 
//       rb.id,
//       f.id AS file_id,
//       f.name,
//       f.size,
//       f.type,
//       f.item_type,
//       rb.original_path,
//       rb.date_deleted,
//       f.path AS file_path
//     FROM recycle_bin rb
//     JOIN drive_files f ON rb.file_id = f.id
//     WHERE rb.user_id = ?
//     ORDER BY rb.date_deleted DESC
//   `;

//   db.query(sql, [userId], (err, results) => {
//     if (err) {
//       console.error('Database error:', err);
//       return res.status(500).json({ error: 'Database error' });
//     }
//     res.json(results);
//   });
// });

// // Restore from recycle bin
// router.post('/recycle_bin/restore/:id', (req, res) => {
//   const { id } = req.params;
//   const token = req.headers.authorization?.split(' ')[1];
// const userId = req.query.userId; // Get from query params like the other routes

// if (!token || !userId) {
//   return res.status(401).json({ error: 'Authorization token and user ID required' });
// }

//   db.beginTransaction(err => {
//     if (err) return res.status(500).json({ error: 'Transaction error' });

//     // 1. Get the recycle bin item
//     const getSql = 'SELECT file_id FROM recycle_bin WHERE id = ? AND user_id = ?';
//     db.query(getSql, [id, userId], (err, results) => {
//       if (err) {
//         return db.rollback(() => {
//           res.status(500).json({ error: 'Database error' });
//         });
//       }
//      if (results.length === 0) {
//   return res.status(200).json({ message: 'Recycle bin is already empty' });
// }

//       const fileId = results[0].file_id;

//       // // 2. Restore the file
//       // // const updateSql = 'UPDATE drive_files SET is_deleted = FALSE WHERE id = ?';
//       // db.query(updateSql, [fileId], (err) => {
//       //   if (err) {
//       //     return db.rollback(() => {
//       //       res.status(500).json({ error: 'Restore error' });
//       //     });
//       //   }

//         // 3. Remove from recycle bin
//         const deleteSql = 'DELETE FROM recycle_bin WHERE id = ?';
//         db.query(deleteSql, [id], (err) => {
//           if (err) {
//             return db.rollback(() => {
//               res.status(500).json({ error: 'Delete error' });
//             });
//           }

//           db.commit(err => {
//             if (err) {
//               return db.rollback(() => {
//                 res.status(500).json({ error: 'Commit error' });
//               });
//             }
//             res.json({ message: 'Item restored successfully' });
//           });
//         });
//       });
//     });
//   });
// // });

// // Empty recycle bin
// router.delete('/recycle_bin', (req, res) => {
//  const token = req.headers.authorization?.split(' ')[1];
// const userId = req.query.userId;

// if (!token || !userId) {
//   return res.status(401).json({ error: 'Authorization token and user ID required' });
// }

//   db.beginTransaction(err => {
//     if (err) return res.status(500).json({ error: 'Transaction error' });

//     // 1. Get all files in recycle bin to permanently delete
//     const getSql = 'SELECT file_id FROM recycle_bin WHERE user_id = ?';
//     db.query(getSql, [userId], (err, results) => {
//       if (err) {
//         return db.rollback(() => {
//           res.status(500).json({ error: 'Database error' });
//         });
//       }

//       const fileIds = results.map(r => r.file_id);

//     if (!Array.isArray(fileIds) || fileIds.length === 0) {
//   return res.status(400).json({ error: 'No files to delete from recycle bin' });
// }


//       // 2. Permanently delete files from drive_files
//       const deleteFilesSql = `DELETE FROM recycle_bin WHERE id IN (${fileIds.map(() => '?').join(',')})`;
    
//      db.query(deleteFilesSql, fileIds.length ? [...fileIds] : [], (err) => {


//         if (err) {
//           return db.rollback(() => {
//             res.status(500).json({ error: 'Delete error' });
//           });
//         }

//         // 3. Delete from recycle bin
//         const deleteBinSql = 'DELETE FROM recycle_bin WHERE user_id = ?';
//         db.query(deleteBinSql, [userId], (err) => {
//           if (err) {
//             return db.rollback(() => {
//               res.status(500).json({ error: 'Bin cleanup error' });
//             });
//           }

//           db.commit(err => {
//             if (err) {
//               return db.rollback(() => {
//                 res.status(500).json({ error: 'Commit error' });
//               });
//             }
//             res.json({ message: 'Recycle bin emptied' });
//           });
//         });
//       });
//     });
//   });
// });

// module.exports = router;


const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth-middleware');
const router = express.Router();

// Configure storage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Create folder or document
router.post('/folders', authenticateToken, (req, res) => {
  const { name, type, itemType, category, content, headers, theme, slides, parentId, service, external_url } = req.body;
  
  if (!name || !type || !itemType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // For external services, we don't need to store content locally
  const shouldStoreContent = !service || service === 'Desktop applications';
  
  const sql = `INSERT INTO drive_files 
    (name, type, item_type, user_id, parent_id, category, content, headers, theme, slides, service, external_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const params = [
    name, 
    type, 
    itemType,
    req.user.id,
    parentId || null,
    category || null,
    shouldStoreContent ? (content || null) : null,
    headers ? JSON.stringify(headers) : null,
    theme || null,
    slides || null,
    service || null,
    external_url || null
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Failed to create item',
        details: err.message 
      });
    }
    
    res.status(201).json({
      id: result.insertId,
      name,
      type,
      item_type: itemType,
      category,
      content: shouldStoreContent ? content : null,
      headers,
      theme,
      slides,
      service,
      external_url,
      user_id: req.user.id,
      parent_id: parentId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
});

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const parentId = req.body.parentId || null;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    const sql = `INSERT INTO drive_files 
      (name, path, size, type, item_type, user_id, parent_id) 
      VALUES (?, ?, ?, ?, 'file', ?, ?)`;

    db.query(sql, [
      file.originalname,
      file.path,
      fileSize,
      file.mimetype,
      req.user.id,
      parentId
    ], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ 
        message: 'File uploaded successfully',
        fileId: result.insertId,
        name: file.originalname,
        path: file.path,
        size: fileSize,
        type: file.mimetype,
        itemType: 'file',
        userId: req.user.id,
        parentId
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get files and folders
router.get('/folders', authenticateToken, (req, res) => {
  const parentId = req.query.parentId || null;

  let sql = `SELECT * FROM drive_files WHERE user_id = ?`;
  const params = [req.user.id];

  if (parentId) {
    sql += ` AND parent_id = ?`;
    params.push(parentId);
  } else {
    sql += ` AND parent_id IS NULL`;
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get single item
router.get('/folders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM drive_files WHERE id = ? AND user_id = ?`;
  db.query(sql, [id, req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(results[0]);
  });
});

// Update item
router.put('/folders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, content, headers, theme, slides } = req.body;

  const sql = `UPDATE drive_files SET 
    name = ?, 
    content = ?, 
    headers = ?, 
    theme = ?, 
    slides = ?, 
    updated_at = NOW() 
    WHERE id = ? AND user_id = ?`;

  db.query(sql, [
    name,
    content,
    headers ? JSON.stringify(headers) : null,
    theme,
    slides,
    id,
    req.user.id
  ], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item updated successfully' });
  });
});

// Delete item (move to recycle bin)
router.delete('/folders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction error' });

    const getItemSql = 'SELECT * FROM drive_files WHERE id = ? AND user_id = ?';
    db.query(getItemSql, [id, req.user.id], (err, results) => {
      if (err || results.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: 'Item not found' });
        });
      }

      const item = results[0];

      // For files: move to recycle bin
      if (item.item_type === 'file') {
        const insertSql = 'INSERT INTO recycle_bin (file_id, user_id, original_path, name, size, type, item_type, date_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
        db.query(insertSql, [
          id,
          req.user.id,
          item.path || '',
          item.name,
          item.size,
          item.type,
          item.item_type
        ], (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: 'Recycle bin insert failed' });
            });
          }

          const deleteSql = 'DELETE FROM drive_files WHERE id = ?';
          db.query(deleteSql, [id], (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Failed to delete item' });
              });
            }

            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: 'Commit failed' });
                });
              }
              res.json({ message: 'Item moved to recycle bin' });
            });
          });
        });
      } 
      // For folders: just delete (no recycle bin for folders)
      else {
        const deleteSql = 'DELETE FROM drive_files WHERE id = ?';
        db.query(deleteSql, [id], (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: 'Failed to delete folder' });
            });
          }
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Commit failed' });
              });
            }
            res.json({ message: 'Folder deleted permanently' });
          });
        });
      }
    });
  });
});

// Get recycle bin items
router.get('/recycle-bin', authenticateToken, (req, res) => {
  const sql = `SELECT * FROM recycle_bin WHERE user_id = ? ORDER BY date_deleted DESC`;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Restore from recycle bin
router.post('/recycle-bin/restore/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction error' });

    const getSql = 'SELECT * FROM recycle_bin WHERE id = ? AND user_id = ?';
    db.query(getSql, [id, req.user.id], (err, results) => {
      if (err || results.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: 'Recycle bin item not found' });
        });
      }

      const binItem = results[0];

      const restoreSql = `
        INSERT INTO drive_files 
        (id, name, path, size, type, item_type, user_id, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
      `;
      
      db.query(restoreSql, [
        binItem.file_id,
        binItem.name,
        binItem.original_path,
        binItem.size,
        binItem.type,
        binItem.item_type,
        binItem.user_id
      ], (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: 'Failed to restore file' });
          });
        }

        const deleteSql = 'DELETE FROM recycle_bin WHERE id = ?';
        db.query(deleteSql, [id], (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: 'Failed to remove from recycle bin' });
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Commit failed' });
              });
            }
            res.json({ message: 'File restored successfully' });
          });
        });
      });
    });
  });
});

// Empty recycle bin
router.delete('/recycle-bin', authenticateToken, (req, res) => {
  const deleteSql = 'DELETE FROM recycle_bin WHERE user_id = ?';
  db.query(deleteSql, [req.user.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Recycle bin emptied' });
  });
});

// Perform deep cleanup
router.get('/cleanup', authenticateToken, (req, res) => {
  // This is a simulation - in a real app you'd analyze files for duplicates, large files, etc.
  const cleanupResults = {
    duplicateFiles: Math.floor(Math.random() * 10),
    largeFiles: Math.floor(Math.random() * 5),
    temporaryFiles: Math.floor(Math.random() * 15),
    totalSpaceSaved: `${(Math.random() * 500).toFixed(2)} MB`
  };
  
  res.json(cleanupResults);
});

module.exports = router;