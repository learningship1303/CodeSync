import { Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';

export const runCode = async (
  req: Request,
  res: Response
) => {
  try {
    const { language, code } = req.body;

    if (language !== 'javascript') {
      res.status(400).json({
        output: 'Language not supported yet'
      });
      return;
    }

    fs.writeFileSync('temp.js', code);

    exec(
      'node temp.js',
      (error, stdout, stderr) => {
        if (error) {
          res.json({
            output: stderr
          });
          return;
        }

        res.json({
          output: stdout
        });
      }
    );

  } catch (error) {
    res.status(500).json({
      output: 'Execution failed'
    });
  }
};