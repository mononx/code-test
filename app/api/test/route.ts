import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto'
import { prisma } from '@/app/lib/prisma';
import { redis } from '@/app/lib/redis';

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