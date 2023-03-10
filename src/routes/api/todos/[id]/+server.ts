import { error, json } from '@sveltejs/kit';
import { Prisma, PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';
import { isAuthenticated } from '$lib/auth/guards';
import { todoSelect } from '$lib/db/prisma';

const prisma = new PrismaClient();

export const GET: RequestHandler = (async ({ locals, params }) => {
  const session = await locals.getSession();
  isAuthenticated(session);

  const todo = await prisma.todo.findFirst({
    where: { id: params.id, user: { email: session!.user!.email! } },
    select: todoSelect
  });

  return json(todo);
});

export const PUT: RequestHandler = (async ({ locals, params, request }) => {
  const session = await locals.getSession();
  isAuthenticated(session);

  const data: Prisma.TodoUpdateInput = await request.json();

  try {
    await prisma.user.update({
      where: { email: session!.user!.email! },
      data: {
        todos: {
          update: {
            where: { id: params.id },
            data
          }
        }
      }
    });
    return new Response();
  } catch (err) {
    throw error(404, { message: `Todo with id ${params.id} not found` });
  }
});

export const DELETE: RequestHandler = (async ({ locals, params }) => {
  const session = await locals.getSession();
  isAuthenticated(session);

  try {
    await prisma.user.update({
      where: { email: session!.user!.email! },
      data: {
        todos: {
          delete: { id: params.id },
        },
      },
    });
  } catch (err) {
    throw error(404, { message: `Todo with id ${params.id} not found` });
  }

  return new Response(null, { status: 204 });
});
