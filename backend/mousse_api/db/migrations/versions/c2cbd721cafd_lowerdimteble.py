"""LowerDimTeble

Revision ID: c2cbd721cafd
Revises: b96c4682f12c
Create Date: 2025-04-15 18:41:59.679869

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy.vector import VECTOR


# revision identifiers, used by Alembic.
revision = 'c2cbd721cafd'
down_revision = 'b96c4682f12c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('lower_dim',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('record_uuid', sa.UUID(), nullable=False, unique=True),
    sa.Column('title_cleaned', sa.Text(), nullable=False),
    sa.Column('vector', VECTOR(dim=81), nullable=False),
    sa.ForeignKeyConstraint(['record_uuid'], ['core.record.uuid'], onupdate='CASCADE', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='core'
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('lower_dim', schema='core')
    # ### end Alembic commands ###
