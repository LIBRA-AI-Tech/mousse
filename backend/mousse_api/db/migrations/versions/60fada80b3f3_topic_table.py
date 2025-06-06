"""Topic Table

Revision ID: 60fada80b3f3
Revises: 0d4148c60875
Create Date: 2024-09-11 10:31:52.164584

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '60fada80b3f3'
down_revision = '0d4148c60875'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('topic',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('topic', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('topic'),
    schema='core'
    )
    op.create_index('ix_topic_topic', 'topic', ['topic'], unique=False, schema='core')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_topic_topic', table_name='topic', schema='core')
    op.drop_table('topic', schema='core')
    # ### end Alembic commands ###
