import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto'
import { prisma } from '@/app/lib/prisma';
import { redis } from '@/app/lib/redis';

/**
 * @openapi
 * /api/test:
 *   post:
 *     summary: create or retrieve a test record based on id1 and id2
 *     description: input id1 and id2, if the record exists, return the existing userID, otherwise create a new record and return the new userID
 *     tags:
 *       - Test API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id1
 *               - id2
 *             properties:
 *               id1:
 *                 type: string
 *                 example: "123"
 *               id2:
 *                 type: string
 *                 example: "456"
 *     responses:
 *       200:
 *         description: successfully created or retrieved the test record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userID:
 *                   type: string
 *                 message:
 *                   type: string
 *             examples:
 *               createNew:
 *                 summary: Create New Record
 *                 value:
 *                   success: true
 *                   userID: "550e8400-e29b-41d4-a716-446655440000"
 *               cacheHit:
 *                 summary: Already Exists in Cache
 *                 value:
 *                   success: true
 *                   userID: "550e8400-e29b-41d4-a716-446655440000"
 *                   message: "Record already exists in cache"
 *               dbHit:
 *                 summary: Already Exists in Database but Cache Miss
 *                 value:
 *                   success: true
 *                   userID: "550e8400-e29b-41d4-a716-446655440000"
 *                   message: "Record already exists"
 *       400:
 *         description: required fields missing, invalid type, or malformed JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 summary: missing required fields
 *                 value:
 *                   success: false
 *                   error: "Bad Request"
 *                   message: "Both id1 and id2 are required"
 *               wrongType:
 *                 summary: type of id1 or id2 is not string
 *                 value:
 *                   success: false
 *                   error: "Bad Request"
 *                   message: "id1 and id2 must be strings"
 *               invalidJson:
 *                 summary: invalid JSON body
 *                 value:
 *                   success: false
 *                   error: "VALIDATION_ERROR"
 *                   message: "Invalid JSON body"
 */

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id1, id2 } = body;

        if (!id1 || !id2) {
            return NextResponse.json(
                { success: false, error: 'Bad Request', message: 'Both id1 and id2 are required' }, 
                { status: 400 }
            );
        }

        if (typeof id1 !== 'string' || typeof id2 !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Bad Request', message: 'id1 and id2 must be strings' },
                { status: 400 }
            );
        }

        const redisKey = `test_record:${id1}_${id2}`;
        const cachedUserID = await redis.get(redisKey);

        if (cachedUserID) {
            return NextResponse.json(
                { success: true, userID: cachedUserID, message: 'Record already exists in cache' },
                { status: 200 }
            );
        }

        const existRecord = await prisma.test.findUnique({
            where: {
                id1_id2: { id1, id2 }
            }
        });

        if (existRecord) {
            await redis.set(redisKey, existRecord.userID, 'EX', 3600);

            return NextResponse.json(
                { success: true, userID: existRecord.userID, message: 'Record already exists' },
                { status: 200 }
            );
        }

        const newUserID = randomUUID();

        await prisma.test.create({
            data: {
                id1,
                id2,
                userID: newUserID
            }
        });

        await redis.set(redisKey, newUserID, 'EX', 3600);

        return NextResponse.json(
            { success: true, userID: newUserID }, 
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
            { status: 400 }
        );
    }

}