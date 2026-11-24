import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories.js';
import { Button } from '../ui/Button.js';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [validationHint, setValidationHint] = useState<string | null>(null);

  const { data: categories } = useCategories();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setValidationHint('Please enter at least 2 characters to search');
      return;
    }
    setValidationHint(null);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  };

  const navContainerStyle: React.CSSProperties = {
    maxWidth: 'var(--container-max-width)',
    margin: '0 auto',
    padding: 'var(--space-3) var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  };

  const topRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flex: '1',
    maxWidth: '480px',
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-sm)',
    outline: 'none',
  };

  const categoriesNavStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    overflowX: 'auto',
    paddingBottom: 'var(--space-1)',
    fontSize: 'var(--font-size-sm)',
  };

  const categoryLinkStyle: React.CSSProperties = {
    color: 'var(--color-text-muted)',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
    transition: 'color var(--transition-fast)',
  };

  return (
    <header style={headerStyle}>
      <div style={navContainerStyle}>
        <div style={topRowStyle}>
          <Link to="/" style={logoStyle} aria-label="Product Catalogue Home">
            Catalogue
          </Link>

          <form onSubmit={handleSearchSubmit} style={formStyle} role="search">
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (validationHint) setValidationHint(null);
              }}
              aria-label="Search catalogue"
              style={searchInputStyle}
            />
            <Button type="submit" size="sm" variant="primary">
              Search
            </Button>
          </form>
        </div>

        {validationHint && (
          <p
            role="alert"
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-danger)',
              margin: 0,
            }}
          >
            {validationHint}
          </p>
        )}

        {categories && categories.length > 0 && (
          <nav aria-label="Product categories" style={categoriesNavStyle}>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${encodeURIComponent(cat.slug)}`}
                style={categoryLinkStyle}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
