from db.database import engine, Base
from models.user import User
from models.rfp_listing import RFPListing
from models.match import Match
from models.draft import GeneratedDraft
from models.saved_response import SavedResponse


def run_migrations():
    Base.metadata.create_all(bind=engine)
